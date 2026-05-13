import feedparser
from sqlalchemy.orm import Session

from app.schemas import PostCreate
from app.services.post_service import create_post


RSS_FEEDS = [
    {
        "source": "el_universal",
        "platform": "rss_news",
        "url": "https://www.eluniversal.com.mx/rss.xml",
        "tags": "news,mexico,politics"
    },
    {
        "source": "milenio",
        "platform": "rss_news",
        "url": "https://www.milenio.com/rss/feed.xml",
        "tags": "news,mexico,politics"
    },
    {
        "source": "excelsior",
        "platform": "rss_news",
        "url": "https://www.excelsior.com.mx/rss.xml",
        "tags": "news,mexico,politics"
    }
]


def ingest_rss_feed(db: Session, feed_config: dict):
    feed = feedparser.parse(feed_config["url"])

    created = 0
    duplicated = 0
    errors = 0

    for entry in feed.entries:
        title = entry.get("title", "")
        link = entry.get("link", "")
        summary = entry.get("summary", "")

        if not link:
            continue

        post = PostCreate(
            source=feed_config["source"],
            platform=feed_config["platform"],
            title=title,
            url=link,
            raw_content=f"{title}\n\n{summary}",
            language="unknown",
            tags=feed_config.get("tags")
        )

        try:
            result = create_post(db, post)

            if result is None:
                duplicated += 1
            else:
                created += 1

        except Exception as error:
            print(f"RSS error: {error}")
            errors += 1

    return {
        "source": feed_config["source"],
        "created": created,
        "duplicated": duplicated,
        "errors": errors
    }


def ingest_all_rss(db: Session):
    results = []

    for feed_config in RSS_FEEDS:
        results.append(ingest_rss_feed(db, feed_config))

    return {
        "total_sources": len(RSS_FEEDS),
        "results": results
    }