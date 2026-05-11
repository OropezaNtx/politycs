from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.post import Post


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/topics")
def get_topics_analytics(db: Session = Depends(get_db)):

    posts = db.query(Post).all()

    topic_counter = Counter()

    for post in posts:

        if not post.topics:
            continue

        for topic in post.topics:
            topic_counter[topic] += 1

    return {
        "total_posts": len(posts),
        "topics": dict(topic_counter)
    }
