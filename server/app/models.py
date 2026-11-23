from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class Word(BaseModel):
    start: float
    end: float
    text: str


class Segment(BaseModel):
    start: float
    end: float
    text: str
    words: list[Word] = Field(default_factory=list)


class Transcript(BaseModel):
    language: str = "en"
    duration: float = 0.0
    segments: list[Segment] = Field(default_factory=list)

    @property
    def words(self) -> list[Word]:
        return [word for segment in self.segments for word in segment.words]


class ClipOptions(BaseModel):
    count: int = Field(default=6, ge=1, le=30)
    min_duration: float = Field(default=12, ge=5, le=60)
    max_duration: float = Field(default=45, ge=10, le=180)
    caption_style: str = "hype"
    keywords: str = ""
    focus: Literal["auto", "left", "center", "right"] = "auto"


class ClipEdit(BaseModel):
    title: str | None = None
    start: float | None = Field(default=None, ge=0)
    end: float | None = Field(default=None, ge=1)
    caption_style: str | None = None
    focus: Literal["auto", "left", "center", "right"] | None = None
    captions_enabled: bool | None = None


class Clip(BaseModel):
    id: str
    job_id: str
    title: str
    start: float
    end: float
    score: float
    reason: str
    transcript: str = ""
    words: list[Word] = Field(default_factory=list)
    caption_style: str = "hype"
    focus: str = "auto"
    captions_enabled: bool = True
    status: str = "pending"
    video_url: str = ""
    thumbnail_url: str = ""


class PublishRequest(BaseModel):
    destinations: list[str] = Field(default_factory=list)
    rewards: bool = False
    campaign_id: str | None = None
    title: str | None = None
    description: str = ""
    schedule_at: str | None = None
    visibility: str = "PUBLIC"


class PublishResult(BaseModel):
    destination: str
    status: str
    detail: str = ""
    url: str = ""
    id: str = ""


class AutoPublish(BaseModel):
    enabled: bool = False
    destinations: list[str] = Field(default_factory=list)
    rewards: bool = False
    campaign_id: str | None = None
    max_clips: int = Field(default=3, ge=1, le=30)


class Channel(BaseModel):
    id: str
    url: str
    name: str = ""
    created_at: str
    last_scan: str = ""
    seen_videos: list[str] = Field(default_factory=list)
    auto_publish: AutoPublish = Field(default_factory=AutoPublish)
    options: ClipOptions = Field(default_factory=ClipOptions)
    active: bool = True
    error: str = ""


class Campaign(BaseModel):
    id: str
    name: str
    description: str
    cpm: float
    category: str = "General"
    active: bool = True


class UrlJobRequest(BaseModel):
    url: str
    options: ClipOptions = Field(default_factory=ClipOptions)
    auto_publish: AutoPublish = Field(default_factory=AutoPublish)


class ChannelRequest(BaseModel):
    url: str
    options: ClipOptions = Field(default_factory=ClipOptions)
    auto_publish: AutoPublish = Field(default_factory=AutoPublish)


class ChannelPatch(BaseModel):
    active: bool | None = None
    options: ClipOptions | None = None
    auto_publish: AutoPublish | None = None


class ViewsPatch(BaseModel):
    views: int = Field(default=0, ge=0)


class Submission(BaseModel):
    id: str
    clip_id: str
    job_id: str
    campaign_id: str
    campaign_name: str
    title: str
    status: str
    detail: str = ""
    views: int = 0
    earnings: float = 0.0
    created_at: str
