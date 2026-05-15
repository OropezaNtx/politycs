import feedparser
from sqlalchemy.orm import Session

from app.schemas import PostCreate
from app.services.post_service import create_post
from bs4 import BeautifulSoup

RSS_FEEDS = [
    {
        "source": "aristegui",
        "platform": "rss_news",
        "url": "https://editorial.aristeguinoticias.com/feed/",
        "tags": "news,mexico,politics"
    },
    {
        "source": "aristegui_mexico",
        "platform": "rss_news",
        "url": "https://editorial.aristeguinoticias.com/category/mexico/feed/",
        "tags": "news,mexico,politics"
    },
    {
        "source": "proceso",
        "platform": "rss_news",
        "url": "https://www.proceso.com.mx/rss/",
        "tags": "news,mexico,politics"
    },
    {
        "source": "milenio",
        "platform": "rss_news",
        "url": "https://www.milenio.com/api/v1/rss",
        "tags": "news,mexico,politics"
    }
]

def clean_html_content(text: str | None) -> str:
    if not text:
        return ""

    soup = BeautifulSoup(text, "html.parser")
    clean_text = soup.get_text(" ", strip=True)

    return clean_text


def ingest_rss_feed(db: Session, feed_config: dict):
    feed = feedparser.parse(feed_config["url"])

    status = getattr(feed, "status", None)
    content_type = feed.get("headers", {}).get("content-type", "")

    if status and status >= 400:
        print(f"RSS SKIPPED: {feed_config['source']} returned status {status}")
        return {
            "source": feed_config["source"],
            "created": 0,
            "duplicated": 0,
            "errors": 1
        }

    if len(feed.entries) == 0:
        print(f"RSS SKIPPED: {feed_config['source']} returned 0 entries")
        print(f"CONTENT TYPE: {content_type}")
        return {
            "source": feed_config["source"],
            "created": 0,
            "duplicated": 0,
            "errors": 1
        }

    print("===================================")
    print(f"RSS SOURCE: {feed_config['source']}")
    print(f"RSS URL: {feed_config['url']}")
    print(f"RSS STATUS: {getattr(feed, 'status', 'unknown')}")
    print(f"RSS BOZO: {feed.bozo}")
    print(f"RSS ENTRIES: {len(feed.entries)}")
    print("===================================")

    created = 0
    duplicated = 0
    errors = 0

    for entry in feed.entries:
        title = entry.get("title", "")
        link = entry.get("link", "")
        summary = clean_html_content(entry.get("summary", ""))

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

        print(f"Processing RSS item: {title}")
        try:
            result = create_post(db, post)

            if result is None:
                duplicated += 1
            else:
                created += 1

        except Exception as error:
            print("===================================")
            print(f"RSS SOURCE: {feed_config['source']}")
            print(f"RSS TITLE: {title}")
            print(f"RSS LINK: {link}")
            print(f"RSS ERROR: {error}")
            print("===================================")

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