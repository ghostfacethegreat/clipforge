from __future__ import annotations

from pathlib import Path

from .. import config
from ..models import Clip, PublishRequest, PublishResult
from . import facebook, instagram, rewards, tiktok, youtube
from .base import Destination

DESTINATIONS = [
    Destination(
        id="youtube",
        name="YouTube Shorts",
        description="Upload directly to your channel",
        configured=all([config.YOUTUBE_CLIENT_ID, config.YOUTUBE_CLIENT_SECRET, config.YOUTUBE_REFRESH_TOKEN]),
        icon="youtube",
    ),
    Destination(
        id="tiktok",
        name="TikTok",
        description="Publish through the Content Posting API",
        configured=bool(config.TIKTOK_ACCESS_TOKEN),
        icon="tiktok",
    ),
    Destination(
        id="instagram",
        name="Instagram Reels",
        description="Publish via Instagram Graph API",
        configured=all([config.INSTAGRAM_ACCESS_TOKEN, config.INSTAGRAM_USER_ID, config.PUBLIC_BASE_URL]),
        icon="instagram",
    ),
    Destination(
        id="facebook",
        name="Facebook Reels",
        description="Publish to your connected Page",
        configured=all([config.FACEBOOK_ACCESS_TOKEN, config.FACEBOOK_PAGE_ID]),
        icon="facebook",
    ),
    Destination(
        id="rewards",
        name="Creator Rewards",
        description="Submit clip metadata to your rewards webhook",
        configured=bool(config.REWARDS_WEBHOOK_URL),
        icon="rewards",
    ),
]

PUBLISHERS = {
    "youtube": youtube.publish,
    "tiktok": tiktok.publish,
    "instagram": instagram.publish,
    "facebook": facebook.publish,
}


def list_destinations() -> list[Destination]:
    return DESTINATIONS


def publish_clip(clip: Clip, path: Path, request: PublishRequest) -> list[PublishResult]:
    results: list[PublishResult] = []
    for destination in request.destinations:
        publisher = PUBLISHERS.get(destination)
        if publisher:
            results.append(publisher(clip, path, request))
        else:
            results.append(PublishResult(destination=destination, status="error", detail="Unknown destination"))
    if request.rewards:
        results.append(rewards.submit(clip, path, request, results))
    return results
