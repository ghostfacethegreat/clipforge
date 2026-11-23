from __future__ import annotations

import math
import re

from ..config import KEYWORDS
from ..models import Clip, Transcript, Word

HOOK_WORDS = {
    "stop", "wait", "watch", "here's", "heres", "secret", "nobody", "never",
    "everyone", "wrong", "actually", "instead", "first", "best", "last", "free",
    "today", "right", "now", "learn", "need", "want", "imagine", "think",
}
EMOTION_WORDS = {
    "amazing", "insane", "crazy", "wild", "shocking", "unbelievable", "incredible",
    "game", "changer", "life", "love", "hate", "fail", "win", "easy", "hard",
    "secret", "powerful", "brilliant", "genius", "mistake", "results", "proof",
}
QUESTION_WORDS = {"what", "why", "how", "who", "when", "where", "which", "do", "does", "did", "are", "can", "should"}
DEFAULT_KEYWORDS = {"tip", "tips", "trick", "hack", "process", "method", "result", "results", "template", "guide", "free"}


def _words_between(words: list[Word], start: float, end: float) -> list[Word]:
    return [word for word in words if word.start >= start - 0.05 and word.end <= end + 0.05]


def _text(words: list[Word]) -> str:
    return " ".join(word.text for word in words)


def _nearest_boundary(transcript: Transcript, time: float) -> float:
    boundaries = [segment.start for segment in transcript.segments] + [segment.end for segment in transcript.segments]
    return min((abs(time - boundary) for boundary in boundaries), default=99.0)


def _score_window(
    transcript: Transcript,
    words: list[Word],
    start: float,
    end: float,
    keywords: set[str],
) -> tuple[float, list[str]]:
    duration = end - start
    selected = _words_between(words, start, end)
    if len(selected) < 6:
        return 0.0, []

    text = _text(selected)
    lowered = text.lower()
    tokens = re.findall(r"[a-z']+", lowered)
    reasons: list[str] = []

    density = len(selected) / duration
    density_score = max(0.0, 1.0 - abs(density - 2.4) / 2.4)
    if density > 2.0:
        reasons.append("Fast-paced delivery")

    head = _text(selected[: min(12, len(selected))]).lower()
    head_tokens = set(re.findall(r"[a-z']+", head))
    hook = 0.0
    if head_tokens & QUESTION_WORDS or "?" in head:
        hook += 0.45
        reasons.append("Opens with a question")
    if head_tokens & HOOK_WORDS:
        hook += 0.35
        reasons.append("Strong hook")
    if re.search(r"\d", head):
        hook += 0.2
        reasons.append("Number in the hook")
    hook = min(hook, 1.0)

    exclamations = text.count("!")
    emotion_hits = len(set(tokens) & EMOTION_WORDS)
    emotion = min(1.0, exclamations * 0.18 + emotion_hits * 0.1)
    if emotion > 0.25:
        reasons.append("High-energy language")

    keyword_hits = len(set(tokens) & keywords)
    keyword_score = min(1.0, keyword_hits * 0.2)
    if keyword_hits:
        reasons.append("Topic keywords")

    boundary_penalty = min(1.0, (_nearest_boundary(transcript, start) + _nearest_boundary(transcript, end)) / 4.0)
    gaps = [selected[i + 1].start - selected[i].end for i in range(len(selected) - 1)]
    silence_penalty = min(1.0, max(gaps, default=0) / 1.6)
    unique_ratio = len(set(tokens)) / max(1, len(tokens))
    repetition_penalty = 1.0 - unique_ratio

    raw = (
        0.20 * density_score
        + 0.34 * hook
        + 0.19 * emotion
        + 0.15 * keyword_score
        + 0.12 * (1 - boundary_penalty)
        - 0.18 * silence_penalty
        - 0.20 * repetition_penalty
    )
    score = round(max(8.0, min(99.0, 48 + raw * 58)), 1)
    if not reasons:
        reasons = ["Complete thought"]
    return score, reasons[:3]


def find_clips(transcript: Transcript, options) -> list[Clip]:
    words = transcript.words
    if not words or transcript.duration <= 0:
        return []

    keywords = DEFAULT_KEYWORDS | set(KEYWORDS) | {k.strip().lower() for k in options.keywords.split(",") if k.strip()}
    max_duration = min(options.max_duration, transcript.duration)
    min_duration = min(options.min_duration, max_duration)
    if max_duration <= min_duration:
        max_duration = min_duration + 1

    candidates: list[tuple[float, float, float, list[str]]] = []
    for target_duration in {min_duration, (min_duration + max_duration) / 2, max_duration}:
        step = max(1.5, target_duration / 6)
        cursor = 0.0
        while cursor + target_duration <= transcript.duration + 0.01:
            end = cursor + target_duration
            score, reasons = _score_window(transcript, words, cursor, end, keywords)
            if score > 0:
                candidates.append((score, cursor, end, reasons))
            cursor += step

    candidates.sort(key=lambda item: item[0], reverse=True)
    chosen: list[tuple[float, float, float, list[str]]] = []
    for candidate in candidates:
        score, start, end, _ = candidate
        if any(min(end, other_end) - max(start, other_start) > min(end - start, other_end - other_start) * 0.55 for _, other_start, other_end, _ in chosen):
            continue
        if any(abs(((start + end) / 2) - ((other_start + other_end) / 2)) < 12 for _, other_start, other_end, _ in chosen):
            continue
        chosen.append(candidate)
        if len(chosen) >= options.count:
            break

    clips: list[Clip] = []
    for score, start, end, reasons in chosen:
        selected = _words_between(words, start, end)
        if not selected:
            continue
        text = _text(selected)
        clean_start = max(0.0, selected[0].start - 0.12)
        clean_end = min(transcript.duration, selected[-1].end + 0.18)
        title = _make_title(text, score)
        clips.append(
            Clip(
                id="",
                job_id="",
                title=title,
                start=round(clean_start, 3),
                end=round(clean_end, 3),
                score=score,
                reason=" · ".join(reasons),
                transcript=text,
                words=[word.model_copy() for word in selected],
                caption_style=options.caption_style,
                focus=options.focus,
            )
        )

    return sorted(clips, key=lambda clip: clip.score, reverse=True)


def _make_title(text: str, score: float) -> str:
    words = text.split()
    if not words:
        return "Highlight"
    head = " ".join(words[:9]).strip(" ,.!?")
    if len(words) > 9:
        head += "..."
    head = head[:78]
    if score >= 85:
        return f"{head} 🔥"
    return head
