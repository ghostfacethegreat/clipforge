from app.models import ClipOptions, Segment, Transcript, Word
from app.pipeline import score


def make_transcript(texts: list[str], start=0.0, gap=0.35):
    segments = []
    cursor = start
    for text in texts:
        tokens = text.split()
        words = []
        for i, tok in enumerate(tokens):
            ws = cursor + i * 0.35
            we = ws + 0.28
            words.append(Word(start=ws, end=we, text=tok))
        end = cursor + max(len(tokens) * 0.35, 0.5)
        segments.append(Segment(start=cursor, end=end, text=text, words=words))
        cursor = end + gap
    return Transcript(language="en", duration=cursor, segments=segments)


def test_find_clips_returns_ranked_clips():
    transcript = make_transcript([
        "Stop scrolling because this secret trick is insane",
        "I tried this for thirty days and the results were amazing",
        "Here is the exact three step process you need to know",
        "Most people get this completely wrong and fail",
        "Watch until the end because the last tip is a game changer",
        "This changed my life in less than a week no joke",
    ] * 3)
    options = ClipOptions(count=3, min_duration=5, max_duration=15, caption_style="hype")
    clips = score.find_clips(transcript, options)
    assert clips
    assert len(clips) <= 3
    assert all(clip.score > 0 for clip in clips)
    assert all(clip.end > clip.start for clip in clips)
    assert clips == sorted(clips, key=lambda c: c.score, reverse=True)


def test_find_clips_empty_transcript():
    transcript = Transcript(language="en", duration=0.0, segments=[])
    clips = score.find_clips(transcript, ClipOptions())
    assert clips == []
