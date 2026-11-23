from __future__ import annotations

import json
import threading
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from . import config
from .models import Campaign, Clip, PublishResult, Submission

if TYPE_CHECKING:
    from .jobs import Job

DEFAULT_CAMPAIGNS = [
    Campaign(id="creator-starter", name="Creator Starter", description="Open campaign for general short-form clips.", cpm=4.0, category="General"),
    Campaign(id="tech-ai", name="Tech & AI", description="High paying clips about AI, software and startups.", cpm=7.5, category="Technology"),
    Campaign(id="podcast-highlights", name="Podcast Highlights", description="Conversation and interview highlights.", cpm=5.25, category="Podcast"),
]

_lock = threading.RLock()


def campaigns() -> list[Campaign]:
    if not config.CAMPAIGNS_JSON:
        return DEFAULT_CAMPAIGNS
    try:
        data = json.loads(config.CAMPAIGNS_JSON)
        return [Campaign.model_validate(item) for item in data]
    except Exception:
        return DEFAULT_CAMPAIGNS


def find_campaign(campaign_id: str) -> Campaign | None:
    return next((campaign for campaign in campaigns() if campaign.id == campaign_id), None)


def _load() -> list[Submission]:
    if not config.SUBMISSIONS_FILE.exists():
        return []
    try:
        return [Submission.model_validate(item) for item in json.loads(config.SUBMISSIONS_FILE.read_text())]
    except Exception:
        return []


def _save(items: list[Submission]) -> None:
    config.SUBMISSIONS_FILE.write_text(json.dumps([item.model_dump(mode="json") for item in items], indent=2))


def submissions() -> list[Submission]:
    with _lock:
        return sorted(_load(), key=lambda item: item.created_at, reverse=True)


def record_submission(clip: Clip, job: Job, campaign: Campaign | None, results: list[PublishResult]) -> Submission:
    item = Submission(
        id=uuid.uuid4().hex[:12],
        clip_id=clip.id,
        job_id=job.id,
        campaign_id=campaign.id if campaign else "creator-starter",
        campaign_name=campaign.name if campaign else "Creator Starter",
        title=clip.title,
        status="submitted" if any(result.status in ("published", "submitted") for result in results) else "pending",
        detail="; ".join(f"{result.destination}: {result.status}" for result in results),
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    with _lock:
        items = _load()
        items.insert(0, item)
        _save(items[:200])
    return item


def update_views(submission_id: str, views: int) -> Submission | None:
    with _lock:
        items = _load()
        for item in items:
            if item.id == submission_id:
                item.views = max(0, views)
                campaign = find_campaign(item.campaign_id)
                item.earnings = round(item.views / 1000 * (campaign.cpm if campaign else 4.0), 2)
                _save(items)
                return item
    return None


def analytics(jobs: list[Job]) -> dict:
    items = submissions()
    published: dict[str, int] = {}
    for job in jobs:
        for results in [*job.publish_history.values(), *job.auto_results.values()]:
            for result in results:
                if result.status in ("published", "submitted", "scheduled"):
                    published[result.destination] = published.get(result.destination, 0) + 1
    total_views = sum(item.views for item in items)
    return {
        "jobs": len(jobs),
        "clips": sum(len(job.clips) for job in jobs),
        "published": published,
        "submissions": len(items),
        "total_views": total_views,
        "earnings": round(sum(item.earnings for item in items), 2),
        "recent": [item.model_dump(mode="json") for item in items[:20]],
    }
