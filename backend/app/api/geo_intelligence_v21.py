from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.monitoring_scope_service import post_scope_facts
from app.api.project_intelligence_v2 import _now, _post_time, _posts, _project, _scope_payload

router = APIRouter(prefix="/intelligence/v2/project", tags=["Geo Intelligence V2.1"])

CONFIDENCE_WEIGHT = {"high": 1.0, "medium": 0.65, "low": 0.35}


@router.get("/geo21")
def geo_v21(
    source: str = "all",
    project_id: int | None = None,
    window_hours: int = Query(default=168, ge=1, le=720),
    min_confidence: str = Query(default="low", pattern="^(low|medium|high)$"),
    db: Session = Depends(get_db),
):
    project = _project(db, project_id)
    posts = _posts(db, source, project)
    cutoff = _now() - timedelta(hours=window_hours)
    current = [post for post in posts if (_post_time(post) or datetime.min.replace(tzinfo=timezone.utc)) >= cutoff]

    confidence_rank = {"low": 1, "medium": 2, "high": 3}
    minimum_rank = confidence_rank[min_confidence]
    territories = {}

    for post in current:
        facts = post_scope_facts(post)
        for geo in facts.get("geo_evidence", []):
            confidence = geo.get("confidence", "low")
            if confidence_rank.get(confidence, 1) < minimum_rank:
                continue
            key = geo["key"]
            if key not in territories:
                territories[key] = {
                    "key": key,
                    "label": geo.get("label"),
                    "type": geo.get("type"),
                    "state": geo.get("state"),
                    "country": geo.get("country", "México"),
                    "lat": geo.get("lat"),
                    "lng": geo.get("lng"),
                    "mentions": 0,
                    "weighted_mentions": 0.0,
                    "negative_posts": 0,
                    "political_posts": 0,
                    "confidence_counts": Counter(),
                    "topics": Counter(),
                    "evidence": [],
                }
            item = territories[key]
            item["mentions"] += 1
            item["weighted_mentions"] += CONFIDENCE_WEIGHT.get(confidence, 0.35)
            item["confidence_counts"][confidence] += 1
            if post.sentiment == "negative":
                item["negative_posts"] += 1
            if float(post.political_score or 0) > 0:
                item["political_posts"] += 1
            item["topics"].update(str(topic).lower() for topic in (post.topics or []))
            if len(item["evidence"]) < 8:
                item["evidence"].append({
                    "id": post.id,
                    "title": post.title,
                    "source": post.source,
                    "platform": post.platform,
                    "url": post.url,
                    "scraped_at": post.scraped_at,
                    "sentiment": post.sentiment,
                    "political_score": post.political_score,
                    "geo_confidence": confidence,
                    "geo_evidence": geo.get("evidence", []),
                })

    result = []
    for item in territories.values():
        total = item["mentions"]
        confidence_counts = dict(item["confidence_counts"])
        dominant_confidence = max(confidence_counts, key=lambda k: confidence_rank.get(k, 0)) if confidence_counts else "low"
        result.append({
            **{k: v for k, v in item.items() if k not in {"topics", "confidence_counts"}},
            "weighted_mentions": round(item["weighted_mentions"], 2),
            "negative_ratio": round(item["negative_posts"] / total, 2) if total else 0,
            "top_topics": dict(item["topics"].most_common(5)),
            "confidence_counts": confidence_counts,
            "dominant_confidence": dominant_confidence,
        })

    result.sort(key=lambda item: (item["weighted_mentions"], item["mentions"]), reverse=True)
    return {
        "source": source,
        "project_id": project_id,
        "window_hours": window_hours,
        "min_confidence": min_confidence,
        "posts_analyzed": len(current),
        "scope": _scope_payload(posts, project),
        "total_territories": len(result),
        "territories": result,
    }
