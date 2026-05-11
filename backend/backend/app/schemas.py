from datetime import datetime
from pydantic import BaseModel


class PostCreate(BaseModel):
    platform: str
    author_name: str | None = None
    content: str
    post_url: str | None = None


class PostResponse(BaseModel):
    id: int
    platform: str
    author_name: str | None
    content: str
    post_url: str | None
    collected_at: datetime

    class Config:
        from_attributes = True