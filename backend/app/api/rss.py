from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.rss_service import ingest_all_rss


router = APIRouter(
    prefix="/rss",
    tags=["RSS"]
)


@router.post("/ingest")
def ingest_rss(db: Session = Depends(get_db)):
    return ingest_all_rss(db)