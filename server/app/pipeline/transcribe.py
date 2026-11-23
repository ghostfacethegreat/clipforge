from __future__ import annotations

import logging
import threading

from ..config import TRANSCRIBER, WHISPER_MODEL
from ..models import Segment, Transcript, Word

log = logging.getLogger("clipforge.transcribe")

_model = None
_model_lock = threading.Lock()

DEMO_LINES = [
    "Stop scrolling, because this is the trick nobody teaches you.",
    "I tried it for thirty days and the results were honestly insane.",
    "Here is the exact three step process, and step two is the best part.",
    "Most people get this completely wrong, and that is why they fail.",
    "The secret is simple: focus on the one thing that actually moves the needle.",
    "If you want the free template, comment the word template right now.",
    "This changed my life in less than a week, no joke.",
    "Watch until the end, because the last tip is a total game changer.",
]


def _get_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from faster_whisper import WhisperModel

                log.info("Loading Whisper model %s", WHISPER_MODEL)
                _model = WhisperModel(WHISPER_MODEL, device="auto", compute_type="int8")
    return _model


def _demo_transcript(duration: float) -> Transcript:
    segments: list[Segment] = []
    cursor = 0.0
    index = 0
    while cursor < duration:
        text = DEMO_LINES[index % len(DEMO_LINES)]
        tokens = text.split()
        word_len = 0.42
        segment_duration = min(len(tokens) * word_len, max(duration - cursor, 0.1))
        words = []
        for i, token in enumerate(tokens):
            start = cursor + i * word_len
            end = min(start + word_len * 0.82, cursor + segment_duration)
            words.append(Word(start=round(start, 3), end=round(end, 3), text=token))
        segments.append(
            Segment(
                start=round(cursor, 3),
                end=round(cursor + segment_duration, 3),
                text=text,
                words=words,
            )
        )
        cursor += segment_duration + 0.35
        index += 1
    return Transcript(language="en", duration=duration, segments=segments)


def transcribe(video_path, duration: float, progress=None) -> Transcript:
    def report(value: float, message: str) -> None:
        if progress:
            progress(value, message)

    use_demo = TRANSCRIBER == "demo"
    if not use_demo and TRANSCRIBER != "faster-whisper":
        try:
            import faster_whisper  # noqa: F401

            log.info("Using local faster-whisper transcription")
        except Exception as exc:  # pragma: no cover - depends on environment
            log.warning("faster-whisper unavailable (%s); using built-in demo transcript", exc)
            use_demo = True

    if use_demo:
        report(0.25, "Generating demo transcript")
        return _demo_transcript(duration)

    report(0.18, "Loading speech model")
    model = _get_model()
    report(0.28, "Transcribing audio")
    segments_iter, info = model.transcribe(
        str(video_path),
        word_timestamps=True,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 300},
    )

    segments: list[Segment] = []
    collected = 0
    for segment in segments_iter:
        words = [
            Word(start=round(word.start, 3), end=round(word.end, 3), text=word.word.strip())
            for word in (segment.words or [])
            if word.word and word.word.strip()
        ]
        segments.append(
            Segment(
                start=round(segment.start, 3),
                end=round(segment.end, 3),
                text=segment.text.strip(),
                words=words,
            )
        )
        collected += 1
        if collected % 5 == 0:
            report(0.28 + min(0.42, collected * 0.008), "Transcribing audio")

    duration = duration or (info.duration if info else 0.0)
    report(0.70, "Transcript ready")
    return Transcript(language=getattr(info, "language", "en") or "en", duration=duration, segments=segments)
