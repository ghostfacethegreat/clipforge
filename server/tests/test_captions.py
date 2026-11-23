from app.models import Word
from app.pipeline.captions import build_ass


def test_build_ass_disabled_returns_header_only():
    ass = build_ass([Word(start=0, end=1, text="hello")], clip_start=0, enabled=False)
    assert "[Script Info]" in ass
    assert "Dialogue:" not in ass


def test_build_ass_includes_dialogue():
    words = [Word(start=1.0, end=1.3, text="Hello"), Word(start=1.4, end=1.8, text="world")]
    ass = build_ass(words, clip_start=1.0, style_name="hype", enabled=True)
    assert "Dialogue:" in ass
    assert "Hello" in ass
    assert "world" in ass
