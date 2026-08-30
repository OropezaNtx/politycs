from sqlalchemy import Boolean, Column, DateTime, Integer, String, inspect, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.database import Base


class MonitoringProject(Base):
    __tablename__ = "monitoring_projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False, unique=True, index=True)
    description = Column(String(500), nullable=True)
    active = Column(Boolean, nullable=False, default=True)
    match_mode = Column(String(16), nullable=False, default="broad", server_default="broad")

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


def ensure_monitoring_project_schema(engine) -> None:
    """Small compatibility migration for existing local V2 databases."""
    inspector = inspect(engine)
    if "monitoring_projects" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("monitoring_projects")}
    if "match_mode" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE monitoring_projects "
                    "ADD COLUMN match_mode VARCHAR(16) NOT NULL DEFAULT 'broad'"
                )
            )
