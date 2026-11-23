from __future__ import annotations

from ..config import CAPTION_STYLES
from ..models import Word

ASS_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Clipforge,Arial,{font_size},{primary},{secondary},{outline},&H80000000&,{bold},0,0,0,100,100,0,0,1,{outline_width},3,{alignment},60,60,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def _ts(seconds: float) -> str:
    seconds = max(0.0, seconds)
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centis = int(round((seconds - int(seconds)) * 100))
    if centis == 100:
        secs += 1
        centis = 0
    return f"{hours}:{minutes:02d}:{secs:02d}.{centis:02d}"


def _escape(text: str) -> str:
    return text.replace("{", "").replace("}", "").replace("\n", " ").strip()


def _group_words(words: list[Word], max_words: int = 6, max_duration: float = 3.6) -> list[list[Word]]:
    groups: list[list[Word]] = []
    current: list[Word] = []
    for word in words:
        if not word.text.strip():
            continue
        if current:
            gap = word.start - current[-1].end
            too_long = word.end - current[0].start > max_duration
            if gap > 0.85 or len(current) >= max_words or too_long:
                groups.append(current)
                current = []
        current.append(word)
    if current:
        groups.append(current)
    return groups


def build_ass(words: list[Word], clip_start: float, style_name: str = "hype", enabled: bool = True) -> str:
    style = CAPTION_STYLES.get(style_name, CAPTION_STYLES["hype"])
    alignment = {"bottom": 2, "middle": 5, "top": 8}[style["position"]]
    margin_v = {"bottom": 330, "middle": 0, "top": 220}[style["position"]]
    header = ASS_HEADER.format(
        font_size=style["font_size"],
        primary=style["primary"],
        secondary=style["secondary"],
        outline=style["outline"],
        bold=style["bold"],
        outline_width=style["outline_width"],
        alignment=alignment,
        margin_v=margin_v,
    )
    if not enabled or not words:
        return header

    lines: list[str] = []
    for group in _group_words(words):
        start = group[0].start - clip_start
        end = group[-1].end - clip_start
        durations = [max(1, round((word.end - word.start) * 100)) for word in group]
        total = max(sum(durations), 1)
        durations[-1] += max(0, round((end - start) * 100) - total)
        pieces = []
        for word, duration in zip(group, durations):
            pieces.append(r"{\kf%d}%s " % (duration, _escape(word.text)))
        body = "".join(pieces).rstrip()
        lines.append(
            f"Dialogue: 0,{_ts(start)},{_ts(end)},Clipforge,,0,0,0,,{{\\bord1\\fad(160,160)}}{body}"
        )
    return header + "\n".join(lines) + "\n"
