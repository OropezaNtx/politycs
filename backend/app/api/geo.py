from collections import Counter, defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.post import Post
from app.services.geo_service import detect_locations


router = APIRouter(
    prefix="/analytics",
    tags=["Geo Intelligence"]
)


@router.get("/geo")
def get_geo_analytics(
    source: str = "all",
    db: Session = Depends(get_db)
):
    query = db.query(Post)

    if source and source != "all":
        query = query.filter(Post.source == source)

    posts = query.all()

    location_counter = Counter()
    sentiment_by_location = defaultdict(Counter)
    topics_by_location = defaultdict(Counter)
    location_meta = {}

    for post in posts:
        text = f"{post.title or ''} {post.raw_content or ''}"
        locations = detect_locations(text)

        for location in locations:
            key = location["key"]

            location_counter[key] += 1
            location_meta[key] = location

            sentiment_by_location[key][post.sentiment or "unknown"] += 1

            if post.topics:
                for topic in post.topics:
                    topics_by_location[key][topic] += 1

    results = []

    for key, total in location_counter.most_common():
        meta = location_meta[key]

        results.append({
            "key": key,
            "label": meta["label"],
            "type": meta["type"],
            "state": meta["state"],
            "lat": meta["lat"],
            "lng": meta["lng"],
            "total_mentions": total,
            "sentiment": dict(sentiment_by_location[key]),
            "top_topics": dict(topics_by_location[key].most_common(5)),
        })

    return {
        "source": source,
        "total_posts_analyzed": len(posts),
        "total_locations": len(results),
        "locations": results
    }
