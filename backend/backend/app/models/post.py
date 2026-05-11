from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class CollectedPost(Base):
    __tablename__ = "collected_posts"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String(50))
    author_name = Column(Text)
    content = Column(Text)
    post_url = Column(Text)
    collected_at = Column(DateTime(timezone=False), server_default=func.now())