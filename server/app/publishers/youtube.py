from __future__ import annotations

import json
from pathlib import Path

import httpx

from .. import config
from ..models import Clip, PublishRequest, PublishResult
from .base import PublisherError

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def _access_token() -> str:
    if not all([config.YOUTUBE_CLIENT_ID, config.YOUTUBE_CLIENT_SECRET, config.YOUTUBE_REFRESH_TOKEN]):
        raise PublisherError("Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET and YOUTUBE_REFRESH_TOKEN")
    with httpx.Client(timeout=30) as client:
        response = client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": config.YOUTUBE_CLIENT_ID,
                "client_secret": config.YOUTUBE_CLIENT_SECRET,
                "refresh_token": config.YOUTUBE_REFRESH_TOKEN,
                "grant_type": "refresh_token",
                "scope": " ".join(SCOPES),
            },
        )
    if response.is_error:
        raise PublisherError(f"Google OAuth failed: {response.text[:300]}")
    return response.json()["access_token"]


def publish(clip: Clip, path: Path, request: PublishRequest) -> PublishResult:
    try:
        token = _access_token()
        title = request.title or clip.title
        status = "private" if request.visibility.upper() == "PRIVATE" else "public"
        if request.schedule_at:
            status = "private"
        metadata = {
            "snippet": {
                "title": title[:100],
                "description": (request.description or f"Clip created with Clipforge. {clip.reason}")[:5000],
                "tags": ["shorts", "clipforge"] + clip.title.split()[:8],
                "categoryId": "22",
            },
            "status": {"privacyStatus": status, "selfDeclaredMadeForKids": False},
        }
        with path.open("rb") as video_file:
            with httpx.Client(timeout=180) as client:
                response = client.post(
                    "https://www.googleapis.com/upload/youtube/v3/videos",
                    params={"part": "snippet,status", "uploadType": "multipart"},
                    headers={"Authorization": f"Bearer {token}"},
                    files={
                        "metadata": (None, json.dumps(metadata), "application/json"),
                        "video": (f"{clip.id}.mp4", video_file, "video/mp4"),
                    },
                )
        if response.is_error:
            raise PublisherError(f"YouTube upload failed: {response.text[:400]}")
        data = response.json()
        return PublishResult(
            destination="youtube",
            status="scheduled" if request.schedule_at else "published",
            detail="Uploaded as YouTube Short (add schedule time via YouTube Studio if needed)",
            id=data.get("id", ""),
            url=f"https://www.youtube.com/shorts/{data.get('id', '')}" if data.get("id") else "",
        )
    except PublisherError as exc:
        return PublishResult(destination="youtube", status="skipped", detail=str(exc))
    except Exception as exc:  # pragma: no cover
        return PublishResult(destination="youtube", status="error", detail=str(exc)[:400])
