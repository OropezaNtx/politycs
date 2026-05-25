from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.rss_service import ingest_all_rss
from app.config.rss_feeds import RSS_FEEDS


router = APIRouter(
    prefix="/rss",
    tags=["RSS"]
)


@router.post("/ingest")
def ingest_rss(db: Session = Depends(get_db)):
    return ingest_all_rss(db)


@router.get("/feeds")
def get_rss_feeds():
    return {
        "total_feeds": len(RSS_FEEDS),
        "feeds": RSS_FEEDS
    }