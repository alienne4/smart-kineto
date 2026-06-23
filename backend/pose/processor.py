"""Backend pose-detection pipeline.

Runs MediaPipe Pose Landmarker (Tasks API) over an uploaded video, draws the
detected skeleton on each frame, and re-encodes an H.264 playback the browser
can play. Designed to run in a background thread; it reports progress on the
PoseJob row so clients can poll it.
"""
import os
import traceback

from django.conf import settings
from django.core.files import File
from django.db import connection

MODEL_PATH = os.path.join(settings.BASE_DIR, "ml_models", "pose_landmarker_lite.task")

# BlazePose 33-landmark skeleton (pairs of landmark indices).
POSE_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8), (9, 10),
    (11, 12), (11, 13), (13, 15), (15, 17), (15, 19), (15, 21), (17, 19),
    (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20),
    (11, 23), (12, 24), (23, 24),
    (23, 25), (25, 27), (27, 29), (29, 31), (27, 31),
    (24, 26), (26, 28), (28, 30), (30, 32), (28, 32),
]


def _set(job, **fields):
    for k, v in fields.items():
        setattr(job, k, v)
    job.save(update_fields=list(fields.keys()) + ["updated_at"])


def process_job(job_id):
    """Entry point for the worker thread."""
    # Fresh DB connection for this thread.
    connection.close()
    from .models import PoseJob

    job = PoseJob.objects.filter(id=job_id).first()
    if not job:
        return
    try:
        _set(job, status=PoseJob.Status.PROCESSING, progress=1)
        _run(job)
        _set(job, status=PoseJob.Status.DONE, progress=100)
    except Exception:  # noqa: BLE001 — record any failure for the client
        _set(job, status=PoseJob.Status.FAILED, error=traceback.format_exc()[-1500:])
    finally:
        connection.close()


def _run(job):
    import cv2
    import imageio
    import mediapipe as mp
    import numpy as np
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision
    from .models import PoseJob

    src_path = job.source_video.path
    cap = cv2.VideoCapture(src_path)
    if not cap.isOpened():
        raise RuntimeError("Could not open the uploaded video.")

    fps = cap.get(cv2.CAP_PROP_FPS) or 0
    if not fps or fps != fps or fps > 120:  # guard NaN / bogus values
        fps = 30.0
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    _set(job, total_frames=total)

    out_dir = os.path.join(settings.MEDIA_ROOT, "pose", "output", str(job.id))
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "pose.mp4")

    options = vision.PoseLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=vision.RunningMode.VIDEO,
        num_poses=1,
    )

    writer = imageio.get_writer(
        out_path, fps=fps, codec="libx264", quality=7,
        macro_block_size=16, pixelformat="yuv420p",
    )

    keypoints = []
    detected = 0
    idx = 0
    last_pct = 0
    with vision.PoseLandmarker.create_from_options(options) as landmarker:
        while True:
            ok, frame_bgr = cap.read()
            if not ok:
                break
            h, w = frame_bgr.shape[:2]
            rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            ts_ms = int(round(idx * 1000.0 / fps))
            result = landmarker.detect_for_video(mp_image, ts_ms)

            frame_pts = None
            if result.pose_landmarks:
                lm = result.pose_landmarks[0]
                detected += 1
                pts = [(int(p.x * w), int(p.y * h)) for p in lm]
                # connections
                for a, b in POSE_CONNECTIONS:
                    if a < len(pts) and b < len(pts):
                        cv2.line(frame_bgr, pts[a], pts[b], (34, 211, 238), 2, cv2.LINE_AA)
                # joints
                for (x, y) in pts:
                    cv2.circle(frame_bgr, (x, y), 4, (167, 139, 250), -1, cv2.LINE_AA)
                frame_pts = [
                    [round(p.x, 4), round(p.y, 4), round(getattr(p, "visibility", 0.0), 3)]
                    for p in lm
                ]
            keypoints.append(frame_pts)

            writer.append_data(cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB))

            idx += 1
            # Recorded webm often lacks a frame count; fall back to a smooth
            # asymptotic estimate so the progress bar still advances.
            if total > 0:
                pct = min(99, int(idx * 100 / total))
            else:
                pct = min(95, int(100 * idx / (idx + 25)))
            if pct >= last_pct + 2:
                last_pct = pct
                _set(job, progress=pct, detected_frames=detected)

    cap.release()
    writer.close()

    # Sample keypoints if very long to keep the row small.
    if len(keypoints) > 1200:
        step = len(keypoints) // 1200 + 1
        keypoints = keypoints[::step]

    with open(out_path, "rb") as fh:
        job.output_video.save("pose.mp4", File(fh), save=False)
    job.keypoints = keypoints
    job.detected_frames = detected
    job.save(update_fields=["output_video", "keypoints", "detected_frames", "updated_at"])
