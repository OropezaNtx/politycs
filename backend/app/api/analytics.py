from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.post import Post


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


def get_filtered_posts(db: Session, source: str = "all"):
    query = db.query(Post)

    if source and source != "all":
        query = query.filter(Post.source == source)

    return query.all()


@router.get("/topics")
def get_topics_analytics(
    source: str = "all",
    db: Session = Depends(get_db)
):
    posts = get_filtered_posts(db, source)

    topic_counter = Counter()

    for post in posts:
        if not post.topics:
            continue

        for topic in post.topics:
            topic_counter[topic] += 1

    return {
        "source": source,
        "total_posts": len(posts),
        "topics": dict(topic_counter)
    }


@router.get("/sentiment")
def get_sentiment_analytics(
    source: str = "all",
    db: Session = Depends(get_db)
):
    posts = get_filtered_posts(db, source)

    sentiment_counter = Counter()

    for post in posts:
        sentiment = post.sentiment or "unknown"
        sentiment_counter[sentiment] += 1

    return {
        "source": source,
        "total_posts": len(posts),
        "sentiment": dict(sentiment_counter)
    }


@router.get("/top-political")
def get_top_political_posts(
    source: str = "all",
    limit: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(Post).filter(Post.political_score > 0)

    if source and source != "all":
        query = query.filter(Post.source == source)

    posts = (
        query
        .order_by(Post.political_score.desc())
        .limit(limit)
        .all()
    )

    return {
        "source": source,
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
def get_analytics_summary(
    source: str = "all",
    db: Session = Depends(get_db)
):
    posts = get_filtered_posts(db, source)

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
    top_topic = next(iter(top_topics), "N/A")

    return {
        "source": source,
        "total_posts": total_posts,
        "political_posts": len(political_posts),
        "negative_posts": len(negative_posts),
        "toxic_posts": len(toxic_posts),
        "political_ratio": round(len(political_posts) / total_posts, 2) if total_posts else 0,
        "negative_ratio": round(len(negative_posts) / total_posts, 2) if total_posts else 0,
        "toxic_ratio": round(len(toxic_posts) / total_posts, 2) if total_posts else 0,
        "top_topic": top_topic,
        "top_topics": top_topics,
        "sentiment_distribution": dict(sentiment_counter)
    }


@router.get("/by-topic/{topic}")
def get_posts_by_topic(
    topic: str,
    source: str = "all",
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Post).filter(Post.topics.contains([topic]))

    if source and source != "all":
        query = query.filter(Post.source == source)

    posts = (
        query
        .order_by(Post.id.desc())
        .limit(limit)
        .all()
    )

    return {
        "source": source,
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


@router.get("/trends")
def get_topic_trends(
    source: str = "all",
    db: Session = Depends(get_db)
):
    posts = get_filtered_posts(db, source)

    trends = {}

    for post in posts:
        if not post.scraped_at:
            continue

        date_key = post.scraped_at.strftime("%Y-%m-%d")

        if date_key not in trends:
            trends[date_key] = {}

        topic_list = post.topics if post.topics else ["unknown"]

        for topic in topic_list:
            if topic not in trends[date_key]:
                trends[date_key][topic] = 0

            trends[date_key][topic] += 1

    return {
        "source": source,
        "total_days": len(trends),
        "trends": trends
    }


@router.get("/by-source")
def get_posts_by_source(db: Session = Depends(get_db)):
    posts = db.query(Post).all()

    source_counter = Counter()
    platform_counter = Counter()

    for post in posts:
        source_counter[post.source or "unknown"] += 1
        platform_counter[post.platform or "unknown"] += 1

    return {
        "total_posts": len(posts),
        "by_source": dict(source_counter),
        "by_platform": dict(platform_counter)
    }


@router.get("/negative-posts")
def get_negative_posts(
    source: str = "all",
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Post).filter(Post.sentiment == "negative")

    if source and source != "all":
        query = query.filter(Post.source == source)

    posts = (
        query
        .order_by(Post.political_score.desc(), Post.id.desc())
        .limit(limit)
        .all()
    )

    return {
        "source": source,
        "total_returned": len(posts),
        "posts": [
            {
                "id": post.id,
                "title": post.title,
                "source": post.source,
                "platform": post.platform,
                "topics": post.topics,
                "political_score": post.political_score,
                "toxicity_score": post.toxicity_score,
                "url": post.url
            }
            for post in posts
        ]
    }


@router.get("/sources")
def get_available_sources(db: Session = Depends(get_db)):
    posts = db.query(Post).all()

    source_counter = Counter()
    platform_counter = Counter()

    for post in posts:
        source_counter[post.source or "unknown"] += 1
        platform_counter[post.platform or "unknown"] += 1

    return {
        "total_posts": len(posts),
        "sources": [
            {
                "name": source,
                "total_posts": total
            }
            for source, total in source_counter.items()
        ],
        "platforms": [
            {
                "name": platform,
                "total_posts": total
            }
            for platform, total in platform_counter.items()
        ]
    }




@router.get("/platform-summary")
def get_platform_summary(db: Session = Depends(get_db)):
    posts = db.query(Post).all()

    platforms = {}

    for post in posts:
        platform = post.platform or "unknown"

        if platform not in platforms:
            platforms[platform] = {
                "platform": platform,
                "total_posts": 0,
                "political_posts": 0,
                "negative_posts": 0,
                "toxic_posts": 0,
                "topics": Counter(),
            }

        platforms[platform]["total_posts"] += 1

        if post.political_score is not None and post.political_score > 0:
            platforms[platform]["political_posts"] += 1

        if post.sentiment == "negative":
            platforms[platform]["negative_posts"] += 1

        if post.toxicity_score is not None and post.toxicity_score > 0:
            platforms[platform]["toxic_posts"] += 1

        if post.topics:
            for topic in post.topics:
                platforms[platform]["topics"][topic] += 1

    result = []

    for platform_data in platforms.values():
        total = platform_data["total_posts"]

        result.append({
            "platform": platform_data["platform"],
            "total_posts": total,
            "political_posts": platform_data["political_posts"],
            "negative_posts": platform_data["negative_posts"],
            "toxic_posts": platform_data["toxic_posts"],
            "political_ratio": round(platform_data["political_posts"] / total, 2) if total else 0,
            "negative_ratio": round(platform_data["negative_posts"] / total, 2) if total else 0,
            "toxic_ratio": round(platform_data["toxic_posts"] / total, 2) if total else 0,
            "top_topics": dict(platform_data["topics"].most_common(5)),
        })

    return {
        "total_platforms": len(result),
        "platforms": result
    }

