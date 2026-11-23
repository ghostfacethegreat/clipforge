from __future__ import annotations

import json
import logging
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from . import rewards, youtube
from .channels import ChannelManager
from .config import CAPTION_STYLES, OUTPUT_DIR, UPLOAD_DIR
from .jobs import JobManager
from .models import ChannelPatch, ChannelRequest, ClipEdit, ClipOptions, PublishRequest, UrlJobRequest, ViewsPatch
from .publishers.registry import list_destinations

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("clipforge")

app = FastAPI(title="Clipforge API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
manager = JobManager(workers=2)
channels = ChannelManager(manager)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "clipforge"}


@app.get("/api/config")
def get_config() -> dict:
    return {
        "caption_styles": [
            {"id": key, "label": value["label"]} for key, value in CAPTION_STYLES.items()
        ],
        "destinations": list_destinations(),
        "campaigns": [campaign.model_dump(mode="json") for campaign in rewards.campaigns()],
    }


@app.post("/api/jobs", status_code=201)
async def create_job(
    file: UploadFile = File(...),
    options: str = Form("{}"),
) -> dict:
    suffix = Path(file.filename or "video.mp4").suffix.lower() or ".mp4"
    if suffix not in {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}:
        raise HTTPException(400, "Unsupported video format")
    try:
        parsed = json.loads(options)
        clip_options = ClipOptions.model_validate(parsed)
    except Exception as exc:
        raise HTTPException(400, f"Invalid options: {exc}") from exc

    target = UPLOAD_DIR / f"{uuid.uuid4().hex}{suffix}"
    with target.open("wb") as output:
        while chunk := await file.read(1024 * 1024):
            output.write(chunk)
    if target.stat().st_size == 0:
        target.unlink(missing_ok=True)
        raise HTTPException(400, "Empty file")

    job = manager.create(target, file.filename or "video.mp4", clip_options)
    return {"id": job.id, "status": job.status}


@app.post("/api/jobs/url", status_code=201)
def create_job_from_url(request: UrlJobRequest) -> dict:
    url = youtube.normalize_url(request.url)
    if not url.startswith(("http://", "https://")):
        raise HTTPException(400, "Enter a valid http(s) video or channel link")
    job = manager.create_from_url(url, request.options, auto_publish=request.auto_publish)
    return {"id": job.id, "status": job.status}


@app.get("/api/jobs")
def list_jobs() -> list[dict]:
    return [job.model_dump(mode="json") for job in manager.list()]


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str) -> dict:
    job = manager.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job.model_dump(mode="json")


@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: str) -> dict:
    if not manager.delete(job_id):
        raise HTTPException(404, "Job not found")
    return {"deleted": True}


@app.get("/api/clips/{clip_id}/video")
def clip_video(clip_id: str) -> FileResponse:
    if not manager.get_clip(clip_id):
        raise HTTPException(404, "Clip not found")
    path = OUTPUT_DIR / f"{clip_id}.mp4"
    if not path.exists():
        raise HTTPException(404, "Clip is not rendered yet")
    return FileResponse(path, media_type="video/mp4", filename=f"clipforge-{clip_id}.mp4")


@app.get("/api/clips/{clip_id}/thumbnail")
def clip_thumbnail(clip_id: str) -> FileResponse:
    if not manager.get_clip(clip_id):
        raise HTTPException(404, "Clip not found")
    path = OUTPUT_DIR / f"{clip_id}.jpg"
    if not path.exists():
        raise HTTPException(404, "Thumbnail not ready")
    return FileResponse(path, media_type="image/jpeg")


@app.patch("/api/clips/{clip_id}")
def edit_clip(clip_id: str, edit: ClipEdit) -> dict:
    clip = manager.update_clip(clip_id, edit)
    if not clip:
        raise HTTPException(404, "Clip not found")
    return clip.model_dump(mode="json")


@app.post("/api/clips/{clip_id}/publish")
def publish_clip(clip_id: str, request: PublishRequest) -> dict:
    results = manager.publish(clip_id, request)
    if results is None:
        raise HTTPException(404, "Clip not found")
    return {"results": [result.model_dump() for result in results]}


@app.get("/api/channels")
def list_channels() -> list[dict]:
    return [channel.model_dump(mode="json") for channel in channels.list()]


@app.post("/api/channels", status_code=201)
def add_channel(request: ChannelRequest) -> dict:
    try:
        channel = channels.add(request.url, request.options, request.auto_publish)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(400, f"Could not read channel: {str(exc)[:300]}") from exc
    return channel.model_dump(mode="json")


@app.patch("/api/channels/{channel_id}")
def patch_channel(channel_id: str, patch: ChannelPatch) -> dict:
    data = patch.model_dump(exclude_none=True, mode="json")
    channel = channels.update(channel_id, data)
    if not channel:
        raise HTTPException(404, "Channel not found")
    return channel.model_dump(mode="json")


@app.delete("/api/channels/{channel_id}")
def remove_channel(channel_id: str) -> dict:
    if not channels.delete(channel_id):
        raise HTTPException(404, "Channel not found")
    return {"deleted": True}


@app.post("/api/channels/{channel_id}/scan")
def scan_channel(channel_id: str) -> dict:
    return {"new_videos": channels.scan(channel_id)}


@app.get("/api/campaigns")
def list_campaigns() -> list[dict]:
    return [campaign.model_dump(mode="json") for campaign in rewards.campaigns()]


@app.get("/api/submissions")
def list_submissions() -> list[dict]:
    return [item.model_dump(mode="json") for item in rewards.submissions()]


@app.patch("/api/submissions/{submission_id}")
def update_submission(submission_id: str, patch: ViewsPatch) -> dict:
    item = rewards.update_views(submission_id, patch.views)
    if not item:
        raise HTTPException(404, "Submission not found")
    return item.model_dump(mode="json")


@app.post("/api/submissions")
def create_submission(payload: dict) -> dict:
    clip_id = payload.get("clip_id", "")
    found = manager.get_clip(clip_id)
    if not found:
        raise HTTPException(404, "Clip not found")
    job, clip = found
    campaign_id = payload.get("campaign_id", "creator-starter")
    campaign = rewards.find_campaign(campaign_id)
    request = PublishRequest(
        destinations=payload.get("destinations", []),
        rewards=True,
        campaign_id=campaign_id,
        title=payload.get("title"),
        description=payload.get("description", ""),
    )
    results = manager.publish(clip_id, request) or []
    item = rewards.record_submission(clip, job, campaign, results)
    return {"submission": item.model_dump(mode="json"), "results": [result.model_dump() for result in results]}


@app.get("/api/analytics")
def get_analytics() -> dict:
    return rewards.analytics(manager.list())


app.mount("/data", StaticFiles(directory=OUTPUT_DIR), name="data")
