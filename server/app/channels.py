from __future__ import annotations

import json
import logging
import threading
import uuid
from datetime import datetime, timezone

from . import config, youtube
from .models import AutoPublish, Channel, ClipOptions

log = logging.getLogger("clipforge.channels")


class ChannelManager:
    def __init__(self, job_manager) -> None:
        self.jobs = job_manager
        self._channels: dict[str, Channel] = {}
        self._lock = threading.RLock()
        self._load()
        self._thread = threading.Thread(target=self._loop, name="clipforge-channels", daemon=True)
        self._thread.start()

    def _load(self) -> None:
        if config.CHANNELS_FILE.exists():
            try:
                for item in json.loads(config.CHANNELS_FILE.read_text()):
                    channel = Channel.model_validate(item)
                    self._channels[channel.id] = channel
            except Exception as exc:  # pragma: no cover
                log.warning("Could not load channels: %s", exc)

    def _save(self) -> None:
        config.CHANNELS_FILE.write_text(
            json.dumps([item.model_dump(mode="json") for item in self._channels.values()], indent=2)
        )

    def list(self) -> list[Channel]:
        with self._lock:
            return list(self._channels.values())

    def get(self, channel_id: str) -> Channel | None:
        with self._lock:
            return self._channels.get(channel_id)

    def add(
        self,
        url: str,
        options: ClipOptions | None = None,
        auto_publish: AutoPublish | None = None,
    ) -> Channel:
        normalized = youtube.normalize_url(url)
        if not youtube.is_channel_url(normalized):
            raise ValueError("Enter a YouTube channel, @handle, videos or playlist URL")
        entries = youtube.channel_uploads(normalized, limit=3)
        channel = Channel(
            id=uuid.uuid4().hex[:12],
            url=normalized,
            name=entries[0].get("channel") or normalized.split("/")[-1] if entries else normalized.split("/")[-1],
            created_at=datetime.now(timezone.utc).isoformat(),
            options=options or ClipOptions(),
            auto_publish=auto_publish or AutoPublish(),
        )
        with self._lock:
            self._channels[channel.id] = channel
            self._save()
        self.scan(channel.id)
        return channel

    def update(self, channel_id: str, patch: dict) -> Channel | None:
        with self._lock:
            channel = self._channels.get(channel_id)
            if not channel:
                return None
            if "active" in patch:
                channel.active = bool(patch["active"])
            if "options" in patch:
                channel.options = ClipOptions.model_validate(patch["options"])
            if "auto_publish" in patch:
                channel.auto_publish = AutoPublish.model_validate(patch["auto_publish"])
            self._save()
            return channel

    def delete(self, channel_id: str) -> bool:
        with self._lock:
            existed = self._channels.pop(channel_id, None) is not None
            if existed:
                self._save()
            return existed

    def scan(self, channel_id: str) -> int:
        channel = self.get(channel_id)
        if not channel:
            return 0
        try:
            entries = youtube.channel_uploads(channel.url, limit=3)
            with self._lock:
                channel.last_scan = datetime.now(timezone.utc).isoformat()
                channel.error = ""
                channel.name = channel.name or channel.url.split("/")[-1]
            new_entries = [entry for entry in entries if entry["id"] and entry["id"] not in channel.seen_videos][:1]
            for entry in reversed(new_entries):
                self.jobs.create_from_url(
                    entry["url"],
                    channel.options,
                    channel_id=channel.id,
                    auto_publish=channel.auto_publish,
                )
            with self._lock:
                channel.seen_videos = [entry["id"] for entry in entries] + channel.seen_videos
                channel.seen_videos = list(dict.fromkeys(channel.seen_videos))[:100]
                self._save()
            return len(new_entries)
        except Exception as exc:
            with self._lock:
                channel.error = str(exc)[:300]
                channel.last_scan = datetime.now(timezone.utc).isoformat()
                self._save()
            return 0

    def _loop(self) -> None:
        while True:
            for channel in self.list():
                if channel.active:
                    self.scan(channel.id)
            threading.Event().wait(max(60, config.CHANNEL_POLL_SECONDS))
