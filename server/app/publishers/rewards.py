from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import httpx

from .. import config, rewards
from ..models import Clip, PublishRequest, PublishResult
from .base import PublisherError


def submit(clip: Clip, path: Path, request: PublishRequest, publish_results: list[PublishResult]) -> PublishResult:
    if not config.REWARDS_WEBHOOK_URL:
        return PublishResult(
            destination="rewards",
            status="skipped",
            detail="Set CLIPFORGE_REWARDS_WEBHOOK_URL to submit clips to a creator rewards program",
        )
    video_url = f"{config.PUBLIC_BASE_URL}/api/clips/{clip.id}/video" if config.PUBLIC_BASE_URL else ""
    campaign = rewards.find_campaign(request.campaign_id) if request.campaign_id else None
    payload = {
        "event": "clip.submitted",
        "clip": {
            "id": clip.id,
            "title": request.title or clip.title,
            "description": request.description,
            "score": clip.score,
            "duration": round(clip.end - clip.start, 2),
            "video_url": video_url,
            "language": "en",
            "source": "clipforge",
        },
        "destinations": [result.model_dump() for result in publish_results],
        "campaign": campaign.model_dump(mode="json") if campaign else None,
        "scheduled_at": request.schedule_at,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
    headers = {"Content-Type": "application/json"}
    if config.REWARDS_API_KEY:
        headers["Authorization"] = f"Bearer {config.REWARDS_API_KEY}"
    try:
        with httpx.Client(timeout=30) as client:
            response = client.post(config.REWARDS_WEBHOOK_URL, json=payload, headers=headers)
        if response.is_error:
            raise PublisherError(f"Rewards webhook returned {response.status_code}: {response.text[:200]}")
        return PublishResult(destination="rewards", status="submitted", detail="Sent to rewards program webhook")
    except PublisherError as exc:
        return PublishResult(destination="rewards", status="error", detail=str(exc))
    except Exception as exc:  # pragma: no cover
        return PublishResult(destination="rewards", status="error", detail=str(exc)[:400])
