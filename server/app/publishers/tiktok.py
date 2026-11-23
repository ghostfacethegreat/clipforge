from __future__ import annotations

from pathlib import Path

import httpx

from .. import config
from ..models import Clip, PublishRequest, PublishResult
from .base import PublisherError


def publish(clip: Clip, path: Path, request: PublishRequest) -> PublishResult:
    if not config.TIKTOK_ACCESS_TOKEN:
        return PublishResult(
            destination="tiktok", status="skipped", detail="Set TIKTOK_ACCESS_TOKEN (Content Posting API access required)"
        )
    try:
        with path.open("rb") as video_file:
            with httpx.Client(timeout=180) as client:
                response = client.post(
                    "https://open.tiktokapis.com/v2/video/publish/",
                    headers={"Authorization": f"Bearer {config.TIKTOK_ACCESS_TOKEN}"},
                    data={
                        "text": (request.title or clip.title)[:150],
                        "privacy_level": "PUBLIC_TO_EVERYONE" if request.visibility.upper() == "PUBLIC" else "SELF_ONLY",
                    },
                    files={"video": (f"{clip.id}.mp4", video_file, "video/mp4")},
                )
        if response.is_error:
            raise PublisherError(f"TikTok publish failed: {response.text[:400]}")
        data = response.json().get("data", {})
        return PublishResult(
            destination="tiktok",
            status="published",
            detail="Published via TikTok Content Posting API",
            id=str(data.get("publish_id", "")),
        )
    except PublisherError as exc:
        return PublishResult(destination="tiktok", status="skipped", detail=str(exc))
    except Exception as exc:  # pragma: no cover
        return PublishResult(destination="tiktok", status="error", detail=str(exc)[:400])
