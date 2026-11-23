from __future__ import annotations

from pathlib import Path

import httpx

from .. import config
from ..models import Clip, PublishRequest, PublishResult
from .base import PublisherError

GRAPH_VIDEO = "https://graph-video.facebook.com/v20.0"


def publish(clip: Clip, path: Path, request: PublishRequest) -> PublishResult:
    if not all([config.FACEBOOK_ACCESS_TOKEN, config.FACEBOOK_PAGE_ID]):
        return PublishResult(
            destination="facebook",
            status="skipped",
            detail="Set FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID",
        )
    try:
        with path.open("rb") as video_file:
            with httpx.Client(timeout=180) as client:
                response = client.post(
                    f"{GRAPH_VIDEO}/{config.FACEBOOK_PAGE_ID}/videos",
                    data={
                        "description": (request.title or clip.title)[:500],
                        "access_token": config.FACEBOOK_ACCESS_TOKEN,
                    },
                    files={"source": (f"{clip.id}.mp4", video_file, "video/mp4")},
                )
        if response.is_error:
            raise PublisherError(f"Facebook upload failed: {response.text[:400]}")
        data = response.json()
        video_id = str(data.get("id", ""))
        return PublishResult(
            destination="facebook",
            status="published",
            detail="Published to Facebook Reels",
            id=video_id,
            url=f"https://www.facebook.com/{config.FACEBOOK_PAGE_ID}/videos/{video_id}" if video_id else "",
        )
    except PublisherError as exc:
        return PublishResult(destination="facebook", status="skipped", detail=str(exc))
    except Exception as exc:  # pragma: no cover
        return PublishResult(destination="facebook", status="error", detail=str(exc)[:400])
