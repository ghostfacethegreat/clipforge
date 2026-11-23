from __future__ import annotations

import logging
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

from pydantic import BaseModel, Field

from .config import JOBS_FILE, OUTPUT_DIR, UPLOAD_DIR
from . import rewards, youtube
from .models import AutoPublish, Clip, ClipEdit, ClipOptions, PublishRequest, PublishResult
from .pipeline import render, score, transcribe
from .publishers.registry import publish_clip

log = logging.getLogger("clipforge.jobs")


class Job(BaseModel):
    id: str
    filename: str
    source_path: str
    created_at: str
    source_url: str = ""
    channel_id: str = ""
    auto_publish: AutoPublish = Field(default_factory=AutoPublish)
    status: str = "queued"
    progress: float = 0.0
    message: str = "Waiting in queue"
    error: str = ""
    options: ClipOptions
    duration: float = 0.0
    clips: list[Clip] = Field(default_factory=list)
    publish_history: dict[str, list[PublishResult]] = Field(default_factory=dict)
    auto_results: dict[str, list[PublishResult]] = Field(default_factory=dict)


class JobManager:
    def __init__(self, workers: int) -> None:
        self._jobs: dict[str, Job] = {}
        self._lock = threading.RLock()
        self._executor = ThreadPoolExecutor(max_workers=workers, thread_name_prefix="clipforge")
        self._load()

    def _load(self) -> None:
        if JOBS_FILE.exists():
            try:
                import json

                data = json.loads(JOBS_FILE.read_text())
                for item in data:
                    job = Job.model_validate(item)
                    if job.status in ("queued", "transcribing", "analyzing", "rendering"):
                        job.status = "error"
                        job.error = "Interrupted by server restart"
                    self._jobs[job.id] = job
            except Exception as exc:  # pragma: no cover
                log.warning("Could not load jobs: %s", exc)

    def _save(self) -> None:
        import json

        payload = [job.model_dump(mode="json") for job in self._jobs.values()]
        JOBS_FILE.write_text(json.dumps(payload, indent=2))

    def _update(self, job: Job, **changes) -> None:
        with self._lock:
            for key, value in changes.items():
                setattr(job, key, value)
            self._save()

    def get(self, job_id: str) -> Job | None:
        with self._lock:
            return self._jobs.get(job_id)

    def list(self) -> list[Job]:
        with self._lock:
            return sorted(self._jobs.values(), key=lambda job: job.created_at, reverse=True)

    def create(self, file_path: Path, filename: str, options: ClipOptions) -> Job:
        job = Job(
            id=uuid.uuid4().hex[:12],
            filename=filename,
            source_path=str(file_path),
            created_at=datetime.now(timezone.utc).isoformat(),
            options=options,
        )
        with self._lock:
            self._jobs[job.id] = job
            self._save()
        self._executor.submit(self._process, job.id)
        return job

    def create_from_url(
        self,
        url: str,
        options: ClipOptions,
        channel_id: str = "",
        auto_publish: AutoPublish | None = None,
    ) -> Job:
        job = Job(
            id=uuid.uuid4().hex[:12],
            filename=url,
            source_path="",
            source_url=youtube.normalize_url(url),
            channel_id=channel_id,
            auto_publish=auto_publish or AutoPublish(),
            created_at=datetime.now(timezone.utc).isoformat(),
            options=options,
            message="Waiting to download video",
        )
        with self._lock:
            self._jobs[job.id] = job
            self._save()
        self._executor.submit(self._process, job.id)
        return job

    def delete(self, job_id: str) -> bool:
        with self._lock:
            job = self._jobs.pop(job_id, None)
            if not job:
                return False
            self._save()
        for clip in job.clips:
            for path in (OUTPUT_DIR / f"{clip.id}.mp4", OUTPUT_DIR / f"{clip.id}.jpg"):
                path.unlink(missing_ok=True)
        if job.source_path:
            Path(job.source_path).unlink(missing_ok=True)
        return True

    def _progress(self, job: Job, value: float, message: str) -> None:
        self._update(job, progress=round(value, 2), message=message)

    def _process(self, job_id: str) -> None:
        job = self.get(job_id)
        if not job:
            return
        try:
            if job.source_url and not job.source_path:
                self._update(job, status="processing", progress=1, message="Downloading video from link")
                path, title, _ = youtube.download(job.source_url, UPLOAD_DIR)
                self._update(job, source_path=str(path), filename=title or job.filename, progress=2, message="Inspecting video")
            else:
                self._update(job, status="processing", progress=2, message="Inspecting video")
            info = render.probe(Path(job.source_path))
            self._update(job, duration=info["duration"])

            def transcribe_progress(value: float, message: str) -> None:
                self._progress(job, 4 + value * 46, message)

            transcript = transcribe.transcribe(Path(job.source_path), info["duration"], transcribe_progress)
            self._update(job, status="analyzing", progress=52, message="Finding the best moments")
            clips = score.find_clips(transcript, job.options)
            for clip in clips:
                clip.id = uuid.uuid4().hex[:12]
                clip.job_id = job.id

            if not clips:
                self._update(job, status="done", progress=100, message="No clips found", error="No speech detected in this video")
                return

            self._update(job, status="rendering", clips=clips, message="Rendering clips")
            total = len(clips)
            for index, clip in enumerate(clips):
                self._progress(job, 55 + (index / total) * 43, f"Rendering clip {index + 1} of {total}")
                destination = OUTPUT_DIR / f"{clip.id}.mp4"
                thumbnail = OUTPUT_DIR / f"{clip.id}.jpg"
                render.render_clip(clip, Path(job.source_path), destination, thumbnail, info)
                clip.status = "ready"
                clip.video_url = f"/api/clips/{clip.id}/video"
                clip.thumbnail_url = f"/api/clips/{clip.id}/thumbnail"
                with self._lock:
                    self._save()
            if job.source_url and job.source_path:
                Path(job.source_path).unlink(missing_ok=True)
                self._update(job, source_path="", message="Source cleaned up")

            if job.auto_publish.enabled:
                self._progress(job, 98, "Auto-posting clips")
                campaign = rewards.find_campaign(job.auto_publish.campaign_id) if job.auto_publish.campaign_id else None
                for clip in clips[: job.auto_publish.max_clips]:
                    results = self.publish(
                        clip.id,
                        PublishRequest(
                            destinations=job.auto_publish.destinations,
                            rewards=job.auto_publish.rewards,
                            campaign_id=job.auto_publish.campaign_id,
                        ),
                    ) or []
                    job.auto_results[clip.id] = results
                    if job.auto_publish.rewards:
                        rewards.record_submission(clip, job, campaign, results)
                with self._lock:
                    self._save()
            self._update(job, status="done", progress=100, message=f"{total} clips ready")
        except Exception as exc:
            log.exception("Job %s failed", job_id)
            self._update(job, status="error", error=str(exc)[:600], message="Processing failed")

    def get_clip(self, clip_id: str) -> tuple[Job, Clip] | None:
        with self._lock:
            for job in self._jobs.values():
                for clip in job.clips:
                    if clip.id == clip_id:
                        return job, clip
        return None

    def update_clip(self, clip_id: str, edit: ClipEdit) -> Clip | None:
        found = self.get_clip(clip_id)
        if not found:
            return None
        job, clip = found
        if edit.title is not None:
            clip.title = edit.title
        if edit.caption_style is not None:
            clip.caption_style = edit.caption_style
        if edit.focus is not None:
            clip.focus = edit.focus
        if edit.captions_enabled is not None:
            clip.captions_enabled = edit.captions_enabled
        if edit.start is not None or edit.end is not None:
            new_start = edit.start if edit.start is not None else clip.start
            new_end = edit.end if edit.end is not None else clip.end
            if new_end - new_start < 2:
                new_end = new_start + 2
            clip.start = round(max(0.0, new_start), 3)
            clip.end = round(min(job.duration or new_end, new_end), 3)
            clip.words = [word for word in clip.words if word.start >= clip.start - 0.05 and word.end <= clip.end + 0.05]
            clip.transcript = " ".join(word.text for word in clip.words)
            clip.status = "rendering"
            self._save()
            info = render.probe(Path(job.source_path))
            render.render_clip(
                clip,
                Path(job.source_path),
                OUTPUT_DIR / f"{clip.id}.mp4",
                OUTPUT_DIR / f"{clip.id}.jpg",
                info,
            )
            clip.status = "ready"
        elif edit.caption_style is not None or edit.focus is not None or edit.captions_enabled is not None:
            clip.status = "rendering"
            self._save()
            info = render.probe(Path(job.source_path))
            render.render_clip(
                clip,
                Path(job.source_path),
                OUTPUT_DIR / f"{clip.id}.mp4",
                OUTPUT_DIR / f"{clip.id}.jpg",
                info,
            )
            clip.status = "ready"
        self._update(job, message="Clip updated")
        return clip

    def publish(self, clip_id: str, request: PublishRequest) -> list[PublishResult] | None:
        found = self.get_clip(clip_id)
        if not found:
            return None
        job, clip = found
        results = publish_clip(clip, OUTPUT_DIR / f"{clip.id}.mp4", request)
        with self._lock:
            job.publish_history[clip.id] = results
            self._save()
        return results
