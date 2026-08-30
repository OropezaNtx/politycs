from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.monitoring_project import MonitoringProject


router = APIRouter(prefix="/projects", tags=["Monitoring Projects"])


class MonitoringProjectPayload(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=500)
    active: bool = True
    sources: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    topics: list[str] = Field(default_factory=list)
    territories: list[str] = Field(default_factory=list)


def serialize_project(project: MonitoringProject) -> dict:
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "active": project.active,
        "sources": project.sources or [],
        "keywords": project.keywords or [],
        "topics": project.topics or [],
        "territories": project.territories or [],
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }


@router.get("")
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(MonitoringProject).order_by(MonitoringProject.id.asc()).all()
    return {"projects": [serialize_project(project) for project in projects]}


@router.get("/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(MonitoringProject).filter(MonitoringProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return serialize_project(project)


@router.post("")
def create_project(payload: MonitoringProjectPayload, db: Session = Depends(get_db)):
    existing = db.query(MonitoringProject).filter(MonitoringProject.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="A project with this name already exists")

    project = MonitoringProject(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return serialize_project(project)


@router.put("/{project_id}")
def update_project(project_id: int, payload: MonitoringProjectPayload, db: Session = Depends(get_db)):
    project = db.query(MonitoringProject).filter(MonitoringProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in payload.model_dump().items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return serialize_project(project)


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(MonitoringProject).filter(MonitoringProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"deleted": True, "project_id": project_id}
