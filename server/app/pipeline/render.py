from __future__ import annotations

import json
import logging
import subprocess
from pathlib import Path

from ..config import WORK_DIR
from ..models import Clip
from .captions import build_ass

log = logging.getLogger("clipforge.render")


def _run(command: list[str]) -> subprocess.CompletedProcess:
    log.debug("Running: %s", " ".join(command))
    return subprocess.run(command, capture_output=True, text=True)


def probe(video_path: Path) -> dict:
    result = _run(
        [
            "ffprobe", "-v", "error", "-show_entries",
            "format=duration:stream=index,codec_type,width,height,r_frame_rate",
            "-of", "json", str(video_path),
        ]
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffprobe failed: {result.stderr[-500:]}")
    data = json.loads(result.stdout)
    streams = data.get("streams", [])
    video = next((stream for stream in streams if stream.get("codec_type") == "video"), {})
    audio = next((stream for stream in streams if stream.get("codec_type") == "audio"), None)
    fps = 30.0
    try:
        numerator, denominator = video.get("r_frame_rate", "30/1").split("/")
        fps = float(numerator) / float(denominator)
    except (ValueError, ZeroDivisionError):
        pass
    return {
        "width": int(video.get("width", 1920)),
        "height": int(video.get("height", 1080)),
        "duration": float(data.get("format", {}).get("duration", 0) or 0),
        "fps": fps,
        "has_audio": audio is not None,
    }


def detect_focus(video_path: Path, start: float, duration: float, hint: str) -> float:
    mapping = {"left": 0.28, "center": 0.5, "right": 0.72}
    if hint in mapping:
        return mapping[hint]
    focus = 0.5
    try:
        import cv2

        cascade_path = Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml"
        detector = cv2.CascadeClassifier(str(cascade_path))
        capture = cv2.VideoCapture(str(video_path))
        fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
        positions = []
        for fraction in (0.2, 0.5, 0.8):
            capture.set(cv2.CAP_PROP_POS_MSEC, (start + duration * fraction) * 1000)
            ok, frame = capture.read()
            if not ok:
                continue
            height, width = frame.shape[:2]
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40))
            if len(faces):
                x, _, face_width, _ = max(faces, key=lambda face: face[2] * face[3])
                positions.append(min(1.0, max(0.0, (x + face_width / 2) / width)))
        capture.release()
        if positions:
            focus = sum(positions) / len(positions)
    except Exception as exc:  # pragma: no cover - optional dependency
        log.debug("Face detection unavailable: %s", exc)
    return round(focus, 3)


def _escape_filter_path(path: Path) -> str:
    return str(path).replace("\\", "/").replace(":", r"\:").replace("'", r"\'")


def render_clip(
    clip: Clip,
    source: Path,
    destination: Path,
    thumbnail: Path,
    media_info: dict,
    progress=None,
) -> None:
    def report(value: float, message: str) -> None:
        if progress:
            progress(value, message)

    duration = max(1.0, clip.end - clip.start)
    ass_path = WORK_DIR / f"{clip.id}.ass"
    ass_path.write_text(
        build_ass(clip.words, clip.start, clip.caption_style, clip.captions_enabled),
        encoding="utf-8",
    )

    focus = detect_focus(source, clip.start, duration, clip.focus)
    crop_x = f"(iw-ow)*{focus:.4f}"
    filters = [
        "scale=1080:1920:force_original_aspect_ratio=increase",
        f"crop=1080:1920:{crop_x}:(ih-oh)/2",
        f"subtitles=filename='{_escape_filter_path(ass_path)}'",
    ]
    report(0.82, "Rendering vertical clip")

    command = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-ss", f"{clip.start:.3f}", "-i", str(source),
        "-t", f"{duration:.3f}",
        "-vf", ",".join(filters),
    ]
    if media_info.get("has_audio"):
        command += ["-af", "loudnorm=I=-16:TP=-1.5:LRA=11"]
    else:
        command += ["-an"]
    command += [
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
        "-pix_fmt", "yuv420p", "-r", "30",
        "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
        "-movflags", "+faststart", str(destination),
    ]
    result = _run(command)
    if result.returncode != 0 or not destination.exists():
        raise RuntimeError(f"ffmpeg render failed: {result.stderr[-800:]}")
    report(0.94, "Creating thumbnail")

    thumb_command = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-ss", "1", "-i", str(destination), "-frames:v", "1",
        "-vf", "scale=360:640", "-q:v", "4", str(thumbnail),
    ]
    thumb_result = _run(thumb_command)
    if thumb_result.returncode != 0 and not thumbnail.exists():
        log.warning("Thumbnail generation failed: %s", thumb_result.stderr[-300:])
    report(1.0, "Clip ready")
