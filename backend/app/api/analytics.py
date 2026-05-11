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


@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    posts = db.query(Post).all()

    total_posts = len(posts)

    political_posts = [
        post for post in posts
        if post.political_score is not None and post.political_score > 0
    ]

    negative_posts = [
        post for post in posts
        if post.sentiment == "negative"
    ]

    toxic_posts = [
        post for post in posts
        if post.toxicity_score is not None and post.toxicity_score > 0
    ]

    topic_counter = Counter()
    sentiment_counter = Counter()

    for post in posts:
        sentiment_counter[post.sentiment or "unknown"] += 1

        if post.topics:
            for topic in post.topics:
                topic_counter[topic] += 1

    top_topics = dict(topic_counter.most_common(5))

    return {
        "total_posts": total_posts,
        "political_posts": len(political_posts),
        "negative_posts": len(negative_posts),
        "toxic_posts": len(toxic_posts),
        "political_ratio": round(len(political_posts) / total_posts, 2) if total_posts else 0,
        "negative_ratio": round(len(negative_posts) / total_posts, 2) if total_posts else 0,
        "toxic_ratio": round(len(toxic_posts) / total_posts, 2) if total_posts else 0,
        "top_topics": top_topics,
        "sentiment_distribution": dict(sentiment_counter)
    }



@router.get("/by-topic/{topic}")
def get_posts_by_topic(
    topic: str,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    posts = (
        db.query(Post)
        .filter(Post.topics.contains([topic]))
        .order_by(Post.id.desc())
        .limit(limit)
        .all()
    )

    return {
        "topic": topic,
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
