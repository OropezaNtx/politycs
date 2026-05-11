from datetime import datetime
from pydantic import BaseModel


class PostCreate(BaseModel):
    source: str
    platform: str
    title: str
    url: str | None = None
    raw_content: str | None = None
    language: str | None = "unknown"
    tags: str | None = None


class PostResponse(BaseModel):
    id: int
    source: str
    platform: str
    title: str
    url: str | None
    raw_content: str | None
    language: str | None
    tags: str | None
    scraped_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
