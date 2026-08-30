from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.database import Base


class MonitoringProject(Base):
    __tablename__ = "monitoring_projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False, unique=True, index=True)
    description = Column(String(500), nullable=True)
    active = Column(Boolean, nullable=False, default=True)

    sources = Column(JSONB, nullable=False, default=list)
    keywords = Column(JSONB, nullable=False, default=list)
    topics = Column(JSONB, nullable=False, default=list)
    territories = Column(JSONB, nullable=False, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
