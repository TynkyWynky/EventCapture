from __future__ import annotations

import unittest

try:
    from backend.api_utils import build_analysis_summary
    from backend.detector import Detection, normalize_supported_drink_label
except ImportError:
    from api_utils import build_analysis_summary
    from detector import Detection, normalize_supported_drink_label


class DrinkDetectionRuleTests(unittest.TestCase):
    def test_normalize_supported_drink_label_accepts_beverage_cans(self):
        accepted_cases = {
            "coca-cola can": ("soda can", "Soft Drink Can"),
            "fanta can": ("soda can", "Soft Drink Can"),
            "sprite can": ("soda can", "Soft Drink Can"),
            "red bull can": ("energy drink can", "Energy Drink Can"),
            "beer can": ("beer can", "Beer Can"),
            "beverage can": ("beverage can", "Beverage Can"),
            "water bottle": ("water bottle", "Water Bottle"),
        }

        for raw_label, expected in accepted_cases.items():
            with self.subTest(raw_label=raw_label):
                self.assertEqual(normalize_supported_drink_label(raw_label), expected)

    def test_normalize_supported_drink_label_rejects_non_beverage_cans(self):
        rejected_labels = ["can", "tin can", "spray can", "aerosol can", "phone", "person"]

        for raw_label in rejected_labels:
            with self.subTest(raw_label=raw_label):
                self.assertEqual(normalize_supported_drink_label(raw_label), (None, None))

    def test_normalize_supported_drink_label_accepts_generic_can_with_visual_evidence(self):
        self.assertEqual(
            normalize_supported_drink_label("can", beverage_evidence=True),
            ("beverage can", "Beverage Can"),
        )

    def test_build_analysis_summary_accepts_visible_beverage_can(self):
        summary = build_analysis_summary(
            [
                Detection(
                    label="beverage can",
                    drink_type="Beverage Can",
                    confidence=0.82,
                    bbox=(40, 20, 180, 320),
                    is_drinking=False,
                )
            ]
        )

        self.assertTrue(summary.has_detections)
        self.assertTrue(summary.crown_eligible)
        self.assertFalse(summary.contains_beer)
        self.assertEqual(summary.headline, "Drink detected")
        self.assertIn("challenge validated", summary.message.lower())

    def test_build_analysis_summary_marks_medium_confidence_as_uncertain(self):
        summary = build_analysis_summary(
            [
                Detection(
                    label="beverage can",
                    drink_type="Beverage Can",
                    confidence=0.47,
                    bbox=(40, 20, 180, 320),
                    is_drinking=False,
                )
            ]
        )

        self.assertTrue(summary.has_detections)
        self.assertFalse(summary.crown_eligible)
        self.assertEqual(summary.status_label, "drink_uncertain")
        self.assertEqual(summary.headline, "Almost there")

    def test_build_analysis_summary_rejects_empty_scene(self):
        summary = build_analysis_summary([])

        self.assertFalse(summary.has_detections)
        self.assertFalse(summary.crown_eligible)
        self.assertEqual(summary.headline, "No drink detected")
        self.assertIn("beverage can", summary.message.lower())


if __name__ == "__main__":
    unittest.main()
