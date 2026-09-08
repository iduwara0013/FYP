"""Tests for keeping model reasoning out of user-facing responses."""

from src.agent.service import _clean_model_text, _fallback_explanation


def test_clean_model_text_keeps_only_text_after_think_block():
    raw = "<think>private analysis and prompt details</think>Tomato is a suitable crop."
    assert _clean_model_text(raw) == "Tomato is a suitable crop."


def test_clean_model_text_rejects_unclosed_reasoning():
    raw = "<think>Here's a thinking process: 1. Analyze User Input"
    assert _clean_model_text(raw) == ""


def test_clean_model_text_rejects_prompt_draft_artifacts():
    raw = "**Analyze User Input:** Crop: Tomato. **Check Constraints:**"
    assert _clean_model_text(raw) == ""


def test_fallback_is_a_short_farmer_facing_paragraph():
    text = _fallback_explanation("Tomato", "Strong demand and low competition.")
    assert text.startswith("Tomato is a suitable option because strong demand")
    assert "prices and yields may change" in text
    assert "<think>" not in text
