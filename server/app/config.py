from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = Path(os.getenv("CLIPFORGE_DATA_DIR", ROOT / "data")).resolve()
UPLOAD_DIR = DATA_DIR / "uploads"
OUTPUT_DIR = DATA_DIR / "outputs"
WORK_DIR = DATA_DIR / "work"
JOBS_FILE = DATA_DIR / "jobs.json"
CHANNELS_FILE = DATA_DIR / "channels.json"
SUBMISSIONS_FILE = DATA_DIR / "submissions.json"

for directory in (DATA_DIR, UPLOAD_DIR, OUTPUT_DIR, WORK_DIR):
    directory.mkdir(parents=True, exist_ok=True)

WHISPER_MODEL = os.getenv("CLIPFORGE_WHISPER_MODEL", "base")
TRANSCRIBER = os.getenv("CLIPFORGE_TRANSCRIBER", "auto").lower()
MAX_JOBS = int(os.getenv("CLIPFORGE_MAX_JOBS", "50"))
RENDER_WORKERS = int(os.getenv("CLIPFORGE_RENDER_WORKERS", "2"))
KEYWORDS = [k.strip().lower() for k in os.getenv("CLIPFORGE_KEYWORDS", "").split(",") if k.strip()]
CHANNEL_POLL_SECONDS = int(os.getenv("CLIPFORGE_CHANNEL_POLL_SECONDS", "900"))
AUTO_POST_DEFAULT = os.getenv("CLIPFORGE_AUTO_POST", "false").lower() == "true"
CAMPAIGNS_JSON = os.getenv("CLIPFORGE_CAMPAIGNS_JSON", "")
YT_COOKIES_FILE = os.getenv("YT_COOKIES_FILE", "")

CAPTION_STYLES = {
    "hype": {
        "label": "Hype",
        "primary": "&H00FFFFFF&",
        "secondary": "&H0000E5FF&",
        "outline": "&H00000000&",
        "bold": -1,
        "font_size": 74,
        "outline_width": 5,
        "position": "bottom",
    },
    "clean": {
        "label": "Clean",
        "primary": "&H00FFFFFF&",
        "secondary": "&H00D9D9D9&",
        "outline": "&H00202020&",
        "bold": 0,
        "font_size": 62,
        "outline_width": 3,
        "position": "bottom",
    },
    "neon": {
        "label": "Neon",
        "primary": "&H00FFFFFF&",
        "secondary": "&H00FF4FD8&",
        "outline": "&H003B0066&",
        "bold": -1,
        "font_size": 72,
        "outline_width": 4,
        "position": "middle",
    },
}

PUBLIC_BASE_URL = os.getenv("CLIPFORGE_PUBLIC_BASE_URL", "").rstrip("/")
REWARDS_WEBHOOK_URL = os.getenv("CLIPFORGE_REWARDS_WEBHOOK_URL", "")
REWARDS_API_KEY = os.getenv("CLIPFORGE_REWARDS_API_KEY", "")
YOUTUBE_CLIENT_ID = os.getenv("YOUTUBE_CLIENT_ID", "")
YOUTUBE_CLIENT_SECRET = os.getenv("YOUTUBE_CLIENT_SECRET", "")
YOUTUBE_REFRESH_TOKEN = os.getenv("YOUTUBE_REFRESH_TOKEN", "")
TIKTOK_ACCESS_TOKEN = os.getenv("TIKTOK_ACCESS_TOKEN", "")
INSTAGRAM_ACCESS_TOKEN = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
INSTAGRAM_USER_ID = os.getenv("INSTAGRAM_USER_ID", "")
FACEBOOK_ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN", "")
FACEBOOK_PAGE_ID = os.getenv("FACEBOOK_PAGE_ID", "")
