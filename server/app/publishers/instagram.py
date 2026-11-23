from __future__ import annotations

import time
from pathlib import Path

import httpx

from .. import config
from ..models import Clip, PublishRequest, PublishResult
from .base import PublisherError

GRAPH = "https://graph.facebook.com/v20.0"


def publish(clip: Clip, path: Path, request: PublishRequest) -> PublishResult:
    if not all([config.INSTAGRAM_ACCESS_TOKEN, config.INSTAGRAM_USER_ID, config.PUBLIC_BASE_URL]):
        return PublishResult(
            destination="instagram",
            status="skipped",
            detail="Set INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID and CLIPFORGE_PUBLIC_BASE_URL",
        )
    video_url = f"{config.PUBLIC_BASE_URL}/api/clips/{clip.id}/video"
    caption = f"{request.title or clip.title}\n\n{request.description}".strip()
    try:
        with httpx.Client(timeout=60) as client:
            response = client.post(
                f"{GRAPH}/{config.INSTAGRAM_USER_ID}/media",
                data={
                    "media_type": "REELS",
                    "video_url": video_url,
                    "caption": caption[:2200],
                    "share_to_feed": "true",
                    "access_token": config.INSTAGRAM_ACCESS_TOKEN,
                },
            )
            if response.is_error:
                raise PublisherError(f"Instagram container failed: {response.text[:400]}")
            container_id = response.json()["id"]
            for _ in range(20):
                status = client.get(
                    f"{GRAPH}/{container_id}",
                    params={"fields": "status_code", "access_token": config.INSTAGRAM_ACCESS_TOKEN},
                ).json().get("status_code")
                if status == "FINISHED":
                    break
                if status in ("ERROR", "EXPIRED"):
                    raise PublisherError(f"Instagram media processing {status}")
                time.sleep(3)
            published = client.post(
                f"{GRAPH}/{config.INSTAGRAM_USER_ID}/media_publish",
                data={"creation_id": container_id, "access_token": config.INSTAGRAM_ACCESS_TOKEN},
            )
            if published.is_error:
                raise PublisherError(f"Instagram publish failed: {published.text[:400]}")
            return PublishResult(
                destination="instagram",
                status="published",
                detail="Published as Instagram Reel",
                id=str(published.json().get("id", "")),
            )
    except PublisherError as exc:
        return PublishResult(destination="instagram", status="skipped", detail=str(exc))
    except Exception as exc:  # pragma: no cover
        return PublishResult(destination="instagram", status="error", detail=str(exc)[:400])
