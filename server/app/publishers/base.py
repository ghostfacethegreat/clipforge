from __future__ import annotations

from pydantic import BaseModel


class Destination(BaseModel):
    id: str
    name: str
    description: str
    configured: bool
    icon: str


class PublisherError(RuntimeError):
    pass
