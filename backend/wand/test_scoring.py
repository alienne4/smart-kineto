"""Pure algorithm tests for wand.scoring — no DB, no Django app registry needed."""
import unittest

import numpy as np

from wand import scoring


def make_frames(n=100, duration_ms=1000, peak_roll=60.0, peak_pitch=20.0, noise=0.0, mirror=False, amp_scale=1.0):
    frames = []
    sign = -1.0 if mirror else 1.0
    for i in range(n):
        t = i / (n - 1)
        roll = np.sin(t * np.pi) * peak_roll * amp_scale * sign
        pitch = np.sin(t * np.pi) * peak_pitch * amp_scale * sign
        if noise:
            roll += np.random.normal(0, noise)
            pitch += np.random.normal(0, noise)
        frames.append(
            {
                "t_ms": int(t * duration_ms),
                "roll": float(roll),
                "pitch": float(pitch),
                "gx": float(np.cos(t * np.pi) * peak_roll * amp_scale * sign * 2),
                "gy": float(np.cos(t * np.pi) * peak_pitch * amp_scale * sign * 2),
                "gz": 0.0,
            }
        )
    return frames


class ScoringTests(unittest.TestCase):
    def setUp(self):
        np.random.seed(0)
        built = scoring.build_template([(make_frames(n=120, duration_ms=1000), 1000)])
        self.template_frames = built.frames
        self.template_duration_ms = built.duration_ms

    def evaluate(self, frames, duration_ms):
        return scoring.evaluate_repetition(frames, duration_ms, self.template_frames, self.template_duration_ms)

    def test_identical_movement_passes(self):
        result = self.evaluate(make_frames(n=100, duration_ms=1000), 1000)
        self.assertTrue(result.is_valid)
        self.assertIsNone(result.rejection_reason)
        self.assertGreaterEqual(result.movement_similarity, 90.0)
        self.assertGreaterEqual(result.graph_score, 90.0)

    def test_too_short_rejected(self):
        frames = [
            {"t_ms": 0, "roll": 0, "pitch": 0, "gx": 0, "gy": 0, "gz": 0},
            {"t_ms": 10, "roll": 1, "pitch": 1, "gx": 0, "gy": 0, "gz": 0},
        ]
        result = self.evaluate(frames, 20)
        self.assertFalse(result.is_valid)
        self.assertEqual(result.rejection_reason, scoring.RejectionReason.TOO_SHORT.value)

    def test_too_fast_rejected(self):
        result = self.evaluate(make_frames(n=100, duration_ms=300), 300)
        self.assertFalse(result.is_valid)
        self.assertEqual(result.rejection_reason, scoring.RejectionReason.TOO_FAST.value)

    def test_too_slow_rejected(self):
        result = self.evaluate(make_frames(n=100, duration_ms=2500), 2500)
        self.assertFalse(result.is_valid)
        self.assertEqual(result.rejection_reason, scoring.RejectionReason.TOO_SLOW.value)

    def test_unstable_rejected(self):
        result = self.evaluate(make_frames(n=100, duration_ms=1000, noise=8.0), 1000)
        self.assertFalse(result.is_valid)
        self.assertEqual(result.rejection_reason, scoring.RejectionReason.UNSTABLE.value)

    def test_wrong_direction_rejected(self):
        result = self.evaluate(make_frames(n=100, duration_ms=1000, mirror=True), 1000)
        self.assertFalse(result.is_valid)
        self.assertEqual(result.rejection_reason, scoring.RejectionReason.WRONG_DIRECTION.value)

    def test_incomplete_rejected(self):
        result = self.evaluate(make_frames(n=100, duration_ms=1000, amp_scale=0.3), 1000)
        self.assertFalse(result.is_valid)
        self.assertEqual(result.rejection_reason, scoring.RejectionReason.INCOMPLETE.value)

    def test_build_template_averages_repetitions(self):
        reps = [
            (make_frames(n=100, duration_ms=900), 900),
            (make_frames(n=100, duration_ms=1100), 1100),
        ]
        built = scoring.build_template(reps)
        self.assertEqual(built.rep_count, 2)
        self.assertEqual(len(built.frames), scoring.N_RESAMPLE)
        self.assertEqual(built.duration_ms, 1000)


if __name__ == "__main__":
    unittest.main()
