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


@router.get("/sentiment")
def get_sentiment_analytics(db: Session = Depends(get_db)):
    posts = db.query(Post).all()

    sentiment_counter = Counter()

    for post in posts:
        sentiment = post.sentiment or "unknown"
        sentiment_counter[sentiment] += 1

    return {
        "total_posts": len(posts),
        "sentiment": dict(sentiment_counter)
    }

@router.get("/top-political")
def get_top_political_posts(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    posts = (
        db.query(Post)
        .filter(Post.political_score > 0)
        .order_by(Post.political_score.desc())
        .limit(limit)
        .all()
    )

    return {
        "total_returned": len(posts),
        "posts": [
            {
                "id": post.id,
                "title": post.title,
                "source": post.source,
                "platform": post.platform,
                "sentiment": post.sentiment,
                "topics": post.topics,
                "political_score": post.political_score,
                "toxicity_score": post.toxicity_score,
                "url": post.url
            }
            for post in posts
        ]
    }
