from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.database import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)

    source = Column(String, nullable=True)
    platform = Column(String, nullable=True)
    title = Column(Text, nullable=True)
    url = Column(Text, unique=True, nullable=False)
    raw_content = Column(Text, nullable=True)
    language = Column(String, nullable=True)
    tags = Column(String, nullable=True)

    sentiment = Column(String, nullable=True)
    keywords = Column(JSONB, nullable=True)
    topics = Column(JSONB, nullable=True)
    entities = Column(JSONB, nullable=True)
    detected_language = Column(String, nullable=True)
    political_score = Column(Float, nullable=True)
    toxicity_score = Column(Float, nullable=True)

    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())