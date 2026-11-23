from __future__ import annotations

import logging
import re
import shutil
from pathlib import Path
from urllib.parse import urlparse

import yt_dlp

from .config import YT_COOKIES_FILE

log = logging.getLogger("clipforge.youtube")

YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"}


def _host(url: str) -> str:
    return (urlparse(url).hostname or "").lower()


def is_youtube(url: str) -> bool:
    host = _host(url)
    return host in YOUTUBE_HOSTS or host.endswith(".youtube.com")


def is_channel_url(url: str) -> bool:
    if not is_youtube(url) or _host(url) == "youtu.be":
        return False
    path = urlparse(url).path
    return any(marker in path for marker in ("/@", "/channel/", "/c/", "/user/", "/videos", "/playlist"))


def normalize_url(url: str) -> str:
    return url.strip().rstrip("/")


def video_id(url: str) -> str:
    if _host(url) == "youtu.be":
        return urlparse(url).path.strip("/").split("/")[0]
    match = re.search(r"(?:v=|/shorts/|/live/|/embed/)([\w-]{11})", url)
    return match.group(1) if match else ""


def _options(**overrides) -> dict:
    options = {
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "noplaylist": True,
        "socket_timeout": 30,
    }
    if YT_COOKIES_FILE:
        options["cookiefile"] = YT_COOKIES_FILE
    options.update(overrides)
    return options


def download(url: str, destination_dir: Path) -> tuple[Path, str, str]:
    url = normalize_url(url)
    free = shutil.disk_usage(destination_dir).free
    if free < 1_500_000_000:
        raise RuntimeError("Not enough disk space to download this video (need ~1.5 GB free)")
    video_id_hint = video_id(url)
    try:
        with yt_dlp.YoutubeDL(
            _options(
                format="bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]/best",
                merge_output_format="mp4",
                outtmpl=str(destination_dir / "%(id)s.%(ext)s"),
                restrictfilenames=True,
                keepvideo=False,
            )
        ) as ydl:
            info = ydl.extract_info(url, download=True)
            filepath = Path(ydl.prepare_filename(info))
            if filepath.suffix != ".mp4":
                candidate = filepath.with_suffix(".mp4")
                filepath = candidate if candidate.exists() else filepath
            return filepath, info.get("title", url), info.get("id", "")
    except Exception:
        if video_id_hint:
            for leftover in destination_dir.glob(f"{video_id_hint}*"):
                if leftover.is_file():
                    leftover.unlink(missing_ok=True)
        raise


def channel_uploads(url: str, limit: int = 5) -> list[dict]:
    url = normalize_url(url)
    if is_channel_url(url) and not urlparse(url).path.rstrip("/").endswith(("/videos", "/playlist", "/streams", "/shorts")):
        url = f"{url}/videos"
    with yt_dlp.YoutubeDL(
        _options(extract_flat="only_playlist", playlistend=limit, ignoreerrors=True)
    ) as ydl:
        info = ydl.extract_info(url, download=False)
    entries = []
    for entry in (info or {}).get("entries", []) or []:
        if not entry:
            continue
        if len(str(entry.get("id", ""))) != 11:
            continue
        video_url = entry.get("url") or entry.get("webpage_url") or ""
        if video_url.startswith("/watch?"):
            video_url = f"https://www.youtube.com{video_url}"
        if not video_url.startswith("http"):
            continue
        entries.append({
            "id": str(entry.get("id", "")),
            "title": entry.get("title", "New upload"),
            "url": video_url,
        })
    return entries
