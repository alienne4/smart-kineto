"""Pure NumPy scoring engine for hardware-wand (IMU) repetitions.

No Django imports here on purpose — this module is independently unit-testable
and mirrors (but extends) the on-device algorithm in
``Firmware/src/ExerciseTemplate.cpp``: resample a variable-length movement
capture to a fixed-length array, then compare it against a trainer-recorded
reference template.

Where the firmware blends everything into one ``totalScore``, this module
keeps ``movement_similarity`` and ``graph_score`` as two independent numbers so
callers can apply the required dual-threshold rule
(``movement_similarity >= 70 and graph_score >= 75``).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Mapping, Optional, Sequence, Tuple

import numpy as np

N_RESAMPLE = 100
MIN_SAMPLES = 5

MIN_DURATION_RATIO = 0.55
MAX_DURATION_RATIO = 1.80

# Same normalization scales as Firmware/include/AppConfig.h.
ANGLE_ERROR_SCALE_DEG = 22.0
GYRO_ERROR_SCALE_DPS = 95.0

# Per-axis weights for the shape-similarity RMSE (roll, pitch, gx, gy, gz) —
# same weighting as the firmware's evaluate().
SHAPE_WEIGHTS = np.array([0.30, 0.30, 0.133333, 0.133333, 0.133334])
SHAPE_SCALES = np.array(
    [
        ANGLE_ERROR_SCALE_DEG,
        ANGLE_ERROR_SCALE_DEG,
        GYRO_ERROR_SCALE_DPS,
        GYRO_ERROR_SCALE_DPS,
        GYRO_ERROR_SCALE_DPS,
    ]
)

MOVEMENT_THRESHOLD = 70.0
GRAPH_THRESHOLD = 75.0
SMOOTHNESS_MIN = 45.0
ROM_MIN = 50.0

Frame = Mapping[str, float]


class RejectionReason(str, Enum):
    TOO_SHORT = "TOO_SHORT"
    TOO_FAST = "TOO_FAST"
    TOO_SLOW = "TOO_SLOW"
    UNSTABLE = "UNSTABLE"
    WRONG_DIRECTION = "WRONG_DIRECTION"
    INCOMPLETE = "INCOMPLETE"
    # Fails the dual threshold without tripping any of the six named heuristics above.
    LOW_SIMILARITY = "LOW_SIMILARITY"


def _wrap_deg(delta: np.ndarray) -> np.ndarray:
    """Wrap angle difference(s) to [-180, 180], like Firmware's angleDifference()."""
    return (delta + 180.0) % 360.0 - 180.0


def resample_and_normalize(frames: Sequence[Frame], n_samples: int = N_RESAMPLE) -> np.ndarray:
    """Resample a variable-length raw capture to a fixed-length (n_samples, 5) array
    of [roll, pitch, gx, gy, gz], angle-unwrapped relative to the first frame.

    Mirrors Firmware/src/ExerciseTemplate.cpp::resampleAndNormalize(): indices (not
    timestamps) are interpolated uniformly across the original samples, which is a
    fair assumption given the wand's fixed ~50 Hz sample rate.
    """
    count = len(frames)
    if count < 2:
        raise ValueError("need at least 2 frames to resample")

    roll = np.array([f["roll"] for f in frames], dtype=float)
    pitch = np.array([f["pitch"] for f in frames], dtype=float)
    gx = np.array([f["gx"] for f in frames], dtype=float)
    gy = np.array([f["gy"] for f in frames], dtype=float)
    gz = np.array([f["gz"] for f in frames], dtype=float)

    positions = np.arange(n_samples) * (count - 1) / (n_samples - 1)
    lower = np.floor(positions).astype(int)
    upper = np.minimum(lower + 1, count - 1)
    frac = positions - lower

    def interp_angle(arr: np.ndarray) -> np.ndarray:
        step = _wrap_deg(arr[upper] - arr[lower])
        return arr[lower] + frac * step

    def interp_linear(arr: np.ndarray) -> np.ndarray:
        return arr[lower] + frac * (arr[upper] - arr[lower])

    initial_roll = roll[0]
    initial_pitch = pitch[0]
    out_roll = _wrap_deg(interp_angle(roll) - initial_roll)
    out_pitch = _wrap_deg(interp_angle(pitch) - initial_pitch)
    out_gx = interp_linear(gx)
    out_gy = interp_linear(gy)
    out_gz = interp_linear(gz)

    return np.stack([out_roll, out_pitch, out_gx, out_gy, out_gz], axis=1)


def frames_to_array(frames: Sequence[Frame]) -> np.ndarray:
    """Convert an already-fixed-length list of {roll,pitch,gx,gy,gz} dicts (as
    stored on a WandReferenceTemplate) directly to a (n, 5) array — no resampling."""
    return np.array(
        [[f["roll"], f["pitch"], f["gx"], f["gy"], f["gz"]] for f in frames], dtype=float
    )


def array_to_frames(array: np.ndarray) -> list[dict]:
    return [
        {"roll": float(r[0]), "pitch": float(r[1]), "gx": float(r[2]), "gy": float(r[3]), "gz": float(r[4])}
        for r in array
    ]


def shape_similarity(candidate: np.ndarray, template: np.ndarray) -> float:
    """Weighted-RMSE-based shape match, 0-100. Same formula as the firmware's
    shapeScore = 100*exp(-1.45*normalized_rmse)."""
    diff = (candidate - template) / SHAPE_SCALES
    weighted_sq = (SHAPE_WEIGHTS * diff**2).sum(axis=1)
    normalized_rmse = float(np.sqrt(weighted_sq.mean()))
    return float(100.0 * np.exp(-1.45 * normalized_rmse))


def rom_similarity(candidate: np.ndarray, template: np.ndarray) -> float:
    """Range-of-motion match: ratio of peak-to-peak roll/pitch range, 0-100."""

    def rom(col: np.ndarray) -> float:
        return float(col.max() - col.min())

    cand_rom = (rom(candidate[:, 0]) + rom(candidate[:, 1])) / 2.0
    tmpl_rom = (rom(template[:, 0]) + rom(template[:, 1])) / 2.0

    if tmpl_rom < 1e-6:
        return 100.0 if cand_rom < 1e-6 else 0.0

    ratio = cand_rom / tmpl_rom
    if ratio <= 0:
        return 0.0
    return float(100.0 * np.exp(-1.5 * abs(np.log(ratio))))


def tempo_similarity(duration_ms: float, template_duration_ms: float) -> Tuple[float, float]:
    """Returns (tempo_score, duration_ratio). Same formula as the firmware's
    durationScore = 100*exp(-2*abs(log(ratio)))."""
    if template_duration_ms <= 0:
        return 0.0, 0.0
    ratio = duration_ms / template_duration_ms
    if ratio <= 0:
        return 0.0, ratio
    score = float(100.0 * np.exp(-2.0 * abs(np.log(ratio))))
    return score, float(ratio)


def smoothness_score(candidate: np.ndarray) -> float:
    """Jerk (second-derivative) magnitude of roll/pitch, normalized by that
    repetition's own range of motion so it's scale-invariant. 100 = smooth,
    lower = shaky/unstable."""

    def jerk_metric(col: np.ndarray) -> float:
        rom = float(col.max() - col.min())
        if rom < 1e-6:
            return 0.0
        d2 = np.diff(col, n=2)
        return float(np.sqrt(np.mean(d2**2)) / rom)

    jerk = (jerk_metric(candidate[:, 0]) + jerk_metric(candidate[:, 1])) / 2.0
    return float(max(0.0, 100.0 * np.exp(-40.0 * jerk)))


def graph_similarity(candidate: np.ndarray, template: np.ndarray) -> Tuple[float, float]:
    """Path/graph similarity via Pearson correlation of the roll & pitch curves.
    Returns (graph_score 0-100, raw_correlation -1..1) — a strongly negative
    raw_correlation flags the movement went the wrong direction."""

    def corr(a: np.ndarray, b: np.ndarray) -> float:
        if a.std() < 1e-6 or b.std() < 1e-6:
            return 1.0 if a.std() < 1e-6 and b.std() < 1e-6 else 0.0
        return float(np.corrcoef(a, b)[0, 1])

    raw_correlation = (corr(candidate[:, 0], template[:, 0]) + corr(candidate[:, 1], template[:, 1])) / 2.0
    graph_score = max(0.0, (raw_correlation + 1.0) / 2.0 * 100.0)
    return float(graph_score), float(raw_correlation)


def _build_preview(candidate: np.ndarray, template: np.ndarray, n_points: int = 20) -> list[dict]:
    idx = np.linspace(0, candidate.shape[0] - 1, n_points).astype(int)
    last = candidate.shape[0] - 1
    return [
        {
            "t": float(i / last) if last else 0.0,
            "candidate_roll": float(candidate[i, 0]),
            "candidate_pitch": float(candidate[i, 1]),
            "template_roll": float(template[i, 0]),
            "template_pitch": float(template[i, 1]),
        }
        for i in idx
    ]


@dataclass
class RepetitionScoreResult:
    movement_similarity: float
    rom_similarity: float
    tempo_similarity: float
    smoothness_score: float
    graph_score: float
    duration_ms: int
    duration_ratio: float
    is_valid: bool
    rejection_reason: Optional[str]
    preview_points: list = field(default_factory=list)


def evaluate_repetition(
    candidate_frames: Sequence[Frame],
    candidate_duration_ms: float,
    template_frames: Sequence[Frame],
    template_duration_ms: float,
    *,
    movement_threshold: float = MOVEMENT_THRESHOLD,
    graph_threshold: float = GRAPH_THRESHOLD,
    min_samples: int = MIN_SAMPLES,
) -> RepetitionScoreResult:
    if len(candidate_frames) < min_samples:
        return RepetitionScoreResult(
            movement_similarity=0.0,
            rom_similarity=0.0,
            tempo_similarity=0.0,
            smoothness_score=0.0,
            graph_score=0.0,
            duration_ms=int(candidate_duration_ms),
            duration_ratio=0.0,
            is_valid=False,
            rejection_reason=RejectionReason.TOO_SHORT.value,
        )

    candidate = resample_and_normalize(candidate_frames)
    template = frames_to_array(template_frames)

    shape = shape_similarity(candidate, template)
    rom = rom_similarity(candidate, template)
    tempo, duration_ratio = tempo_similarity(candidate_duration_ms, template_duration_ms)
    smoothness = smoothness_score(candidate)
    graph, raw_correlation = graph_similarity(candidate, template)

    movement = 0.45 * shape + 0.25 * rom + 0.15 * tempo + 0.15 * smoothness

    reason: Optional[RejectionReason] = None
    if duration_ratio < MIN_DURATION_RATIO:
        reason = RejectionReason.TOO_FAST
    elif duration_ratio > MAX_DURATION_RATIO:
        reason = RejectionReason.TOO_SLOW
    elif smoothness < SMOOTHNESS_MIN:
        reason = RejectionReason.UNSTABLE
    elif raw_correlation < 0:
        reason = RejectionReason.WRONG_DIRECTION
    elif rom < ROM_MIN:
        reason = RejectionReason.INCOMPLETE
    elif movement < movement_threshold or graph < graph_threshold:
        reason = RejectionReason.LOW_SIMILARITY

    return RepetitionScoreResult(
        movement_similarity=round(movement, 2),
        rom_similarity=round(rom, 2),
        tempo_similarity=round(tempo, 2),
        smoothness_score=round(smoothness, 2),
        graph_score=round(graph, 2),
        duration_ms=int(candidate_duration_ms),
        duration_ratio=round(duration_ratio, 4),
        is_valid=reason is None,
        rejection_reason=reason.value if reason else None,
        preview_points=_build_preview(candidate, template),
    )


@dataclass
class TemplateBuildResult:
    frames: list
    duration_ms: int
    rep_count: int


def build_template(
    repetitions: Sequence[Tuple[Sequence[Frame], float]], n_samples: int = N_RESAMPLE
) -> TemplateBuildResult:
    """Average N trainer repetitions into one resampled reference template —
    mirrors Firmware's ExerciseTemplate::addTrainingMovement() averaging."""
    if not repetitions:
        raise ValueError("need at least one repetition")

    resampled = [resample_and_normalize(frames, n_samples) for frames, _duration_ms in repetitions]
    durations = [duration_ms for _frames, duration_ms in repetitions]

    average = np.mean(np.stack(resampled, axis=0), axis=0)
    return TemplateBuildResult(
        frames=array_to_frames(average),
        duration_ms=int(round(float(np.mean(durations)))),
        rep_count=len(repetitions),
    )
