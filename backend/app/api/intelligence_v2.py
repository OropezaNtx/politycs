from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.monitoring_project import MonitoringProject
from app.models.post import Post
from app.services.geo_service import detect_locations


router = APIRouter(prefix="/intelligence/v2", tags=["Intelligence V2"])

SENSITIVE_TOPICS = {
    "seguridad", "corrupcion", "corrupción", "violencia", "crimen",
    "salud", "agua", "transporte", "elecciones", "economia", "economía",
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _post_time(post: Post) -> datetime | None:
    value = post.scraped_at or post.created_at
    if value and value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value


def _project(db: Session, project_id: int | None) -> MonitoringProject | None:
    if project_id is None:
        return None
    project = db.query(MonitoringProject).filter(MonitoringProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _matches_project(post: Post, project: MonitoringProject | None) -> bool:
    if project is None:
        return True

    sources = {str(value).lower() for value in (project.sources or [])}
    keywords = {str(value).lower() for value in (project.keywords or [])}
    topics = {str(value).lower() for value in (project.topics or [])}
    territories = {str(value).lower() for value in (project.territories or [])}

    if sources and (post.source or "").lower() not in sources:
        return False

    text = f"{post.title or ''} {post.raw_content or ''}".lower()
    post_topics = {str(value).lower() for value in (post.topics or [])}

    if keywords and not any(keyword in text for keyword in keywords):
        return False

    if topics and not post_topics.intersection(topics):
        return False

    if territories:
        locations = detect_locations(text)
        detected = {
            str(location.get("key", "")).lower() for location in locations
        } | {
            str(location.get("label", "")).lower() for location in locations
        }
        if not detected.intersection(territories):
            return False

    return True


def _posts(db: Session, source: str, project: MonitoringProject | None) -> list[Post]:
    query = db.query(Post)
    if source and source != "all":
        query = query.filter(Post.source == source)
    return [post for post in query.all() if _matches_project(post, project)]


def _topic_counts(posts: list[Post]) -> Counter:
    counts = Counter()
    for post in posts:
        for topic in post.topics or []:
            counts[str(topic).lower()] += 1
    return counts


def _windowed(posts: list[Post], start: datetime, end: datetime) -> list[Post]:
    result = []
    for post in posts:
        value = _post_time(post)
        if value and start <= value < end:
            result.append(post)
    return result


def _temporal_payload(posts: list[Post], window_hours: int, baseline_days: int) -> dict:
    now = _now()
    current_start = now - timedelta(hours=window_hours)
    baseline_start = current_start - timedelta(days=baseline_days)

    current = _windowed(posts, current_start, now + timedelta(seconds=1))
    baseline = _windowed(posts, baseline_start, current_start)

    current_topics = _topic_counts(current)
    baseline_topics = _topic_counts(baseline)

    current_hours = max(window_hours, 1)
    baseline_hours = max(baseline_days * 24, 1)
    signals = []

    for topic, current_count in current_topics.items():
        baseline_count = baseline_topics.get(topic, 0)
        current_rate = current_count / current_hours
        baseline_rate = baseline_count / baseline_hours
        if baseline_rate == 0:
            growth = None
            acceleration = current_count > 0
        else:
            growth = round(current_rate / baseline_rate, 2)
            acceleration = growth >= 1.5

        evidence = [
            {
                "id": post.id,
                "title": post.title,
                "source": post.source,
                "platform": post.platform,
                "url": post.url,
                "scraped_at": post.scraped_at,
            }
            for post in current
            if topic in {str(value).lower() for value in (post.topics or [])}
        ][:5]

        signals.append({
            "topic": topic,
            "current_count": current_count,
            "baseline_count": baseline_count,
            "current_rate_per_hour": round(current_rate, 3),
            "baseline_rate_per_hour": round(baseline_rate, 3),
            "growth_score": growth,
            "accelerating": acceleration,
            "evidence": evidence,
        })

    signals.sort(
        key=lambda item: (
            item["accelerating"],
            item["growth_score"] if item["growth_score"] is not None else 999,
            item["current_count"],
        ),
        reverse=True,
    )

    return {
        "generated_at": now,
        "window_hours": window_hours,
        "baseline_days": baseline_days,
        "current_posts": len(current),
        "baseline_posts": len(baseline),
        "signals": signals[:15],
    }


def _crisis_payload(posts: list[Post], temporal: dict) -> dict:
    growth_by_topic = {
        item["topic"]: item["growth_score"]
        for item in temporal["signals"]
        if item["growth_score"] is not None
    }
    topic_sources = defaultdict(set)
    for post in posts:
        for topic in post.topics or []:
            topic_sources[str(topic).lower()].add(post.source or "unknown")

    alerts = []
    for post in posts:
        score = 0.0
        factors = []
        post_topics = {str(value).lower() for value in (post.topics or [])}

        if post.sentiment == "negative":
            score += 1.5
            factors.append({"factor": "negative_sentiment", "points": 1.5})

        political = float(post.political_score or 0)
        if political >= 0.6:
            points = round(min(political * 2, 2), 2)
            score += points
            factors.append({"factor": "political_relevance", "points": points})

        toxicity = float(post.toxicity_score or 0)
        if toxicity >= 0.2:
            points = round(min(toxicity * 2, 1.5), 2)
            score += points
            factors.append({"factor": "toxicity", "points": points})

        sensitive = post_topics.intersection(SENSITIVE_TOPICS)
        if sensitive:
            points = min(len(sensitive) * 0.75, 2.25)
            score += points
            factors.append({
                "factor": "sensitive_topics",
                "points": points,
                "topics": sorted(sensitive),
            })

        growth_values = [growth_by_topic[t] for t in post_topics if t in growth_by_topic]
        if growth_values:
            max_growth = max(growth_values)
            if max_growth >= 1.5:
                points = min((max_growth - 1) * 0.8, 2.0)
                score += points
                factors.append({
                    "factor": "topic_acceleration",
                    "points": round(points, 2),
                    "growth": max_growth,
                })

        diversity = max((len(topic_sources[t]) for t in post_topics), default=0)
        if diversity >= 3:
            points = min(diversity * 0.2, 1.0)
            score += points
            factors.append({
                "factor": "source_diversity",
                "points": round(points, 2),
                "sources": diversity,
            })

        score = round(score, 2)
        if score < 3:
            continue

        alerts.append({
            "id": post.id,
            "title": post.title,
            "source": post.source,
            "platform": post.platform,
            "url": post.url,
            "scraped_at": post.scraped_at,
            "topics": post.topics or [],
            "sentiment": post.sentiment,
            "risk_score": score,
            "factors": factors,
        })

    alerts.sort(key=lambda item: item["risk_score"], reverse=True)
    high = sum(1 for item in alerts if item["risk_score"] >= 6)
    medium = sum(1 for item in alerts if 4 <= item["risk_score"] < 6)

    overall = "low"
    if high >= 3 or len(alerts) >= 12:
        overall = "high"
    elif high >= 1 or medium >= 3 or len(alerts) >= 5:
        overall = "medium"

    return {
        "risk_level": overall,
        "total_alerts": len(alerts),
        "high_risk_alerts": high,
        "medium_risk_alerts": medium,
        "alerts": alerts[:30],
    }


def _geo_payload(posts: list[Post]) -> dict:
    territories = {}
    for post in posts:
        text = f"{post.title or ''} {post.raw_content or ''}"
        for location in detect_locations(text):
            key = location["key"]
            if key not in territories:
                territories[key] = {
                    **location,
                    "mentions": 0,
                    "negative_posts": 0,
                    "political_posts": 0,
                    "topics": Counter(),
                    "evidence": [],
                }
            item = territories[key]
            item["mentions"] += 1
            if post.sentiment == "negative":
                item["negative_posts"] += 1
            if float(post.political_score or 0) > 0:
                item["political_posts"] += 1
            item["topics"].update(str(topic).lower() for topic in (post.topics or []))
            if len(item["evidence"]) < 5:
                item["evidence"].append({
                    "id": post.id,
                    "title": post.title,
                    "source": post.source,
                    "url": post.url,
                    "scraped_at": post.scraped_at,
                })

    result = []
    for item in territories.values():
        total = item["mentions"]
        result.append({
            **{key: value for key, value in item.items() if key != "topics"},
            "negative_ratio": round(item["negative_posts"] / total, 2) if total else 0,
            "top_topics": dict(item["topics"].most_common(5)),
        })
    result.sort(key=lambda item: item["mentions"], reverse=True)
    return {"territories": result, "total_territories": len(result)}


@router.get("/temporal")
def temporal_intelligence(
    source: str = "all",
    project_id: int | None = None,
    window_hours: int = Query(default=24, ge=1, le=168),
    baseline_days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    project = _project(db, project_id)
    posts = _posts(db, source, project)
    payload = _temporal_payload(posts, window_hours, baseline_days)
    return {"source": source, "project_id": project_id, **payload}


@router.get("/crisis")
def crisis_intelligence(
    source: str = "all",
    project_id: int | None = None,
    window_hours: int = Query(default=24, ge=1, le=168),
    baseline_days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    project = _project(db, project_id)
    posts = _posts(db, source, project)
    temporal = _temporal_payload(posts, window_hours, baseline_days)
    current_start = _now() - timedelta(hours=window_hours)
    current_posts = [post for post in posts if (_post_time(post) or datetime.min.replace(tzinfo=timezone.utc)) >= current_start]
    return {
        "source": source,
        "project_id": project_id,
        "window_hours": window_hours,
        **_crisis_payload(current_posts, temporal),
    }


@router.get("/geo")
def geo_intelligence(
    source: str = "all",
    project_id: int | None = None,
    window_hours: int = Query(default=168, ge=1, le=720),
    db: Session = Depends(get_db),
):
    project = _project(db, project_id)
    posts = _posts(db, source, project)
    cutoff = _now() - timedelta(hours=window_hours)
    current = [post for post in posts if (_post_time(post) or datetime.min.replace(tzinfo=timezone.utc)) >= cutoff]
    return {
        "source": source,
        "project_id": project_id,
        "window_hours": window_hours,
        "posts_analyzed": len(current),
        **_geo_payload(current),
    }


@router.get("/evidence")
def evidence(
    topic: str | None = None,
    territory: str | None = None,
    source: str = "all",
    project_id: int | None = None,
    limit: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    project = _project(db, project_id)
    posts = _posts(db, source, project)
    topic_lower = topic.lower() if topic else None
    territory_lower = territory.lower() if territory else None
    selected = []

    for post in sorted(posts, key=lambda value: _post_time(value) or datetime.min.replace(tzinfo=timezone.utc), reverse=True):
        if topic_lower and topic_lower not in {str(value).lower() for value in (post.topics or [])}:
            continue
        if territory_lower:
            locations = detect_locations(f"{post.title or ''} {post.raw_content or ''}")
            keys = {str(item["key"]).lower() for item in locations} | {str(item["label"]).lower() for item in locations}
            if territory_lower not in keys:
                continue
        selected.append({
            "id": post.id,
            "title": post.title,
            "source": post.source,
            "platform": post.platform,
            "url": post.url,
            "scraped_at": post.scraped_at,
            "sentiment": post.sentiment,
            "topics": post.topics or [],
            "political_score": post.political_score,
            "toxicity_score": post.toxicity_score,
        })
        if len(selected) >= limit:
            break

    return {"topic": topic, "territory": territory, "total_returned": len(selected), "posts": selected}


@router.get("/brief")
def intelligence_brief(
    source: str = "all",
    project_id: int | None = None,
    window_hours: int = Query(default=24, ge=1, le=168),
    baseline_days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    project = _project(db, project_id)
    posts = _posts(db, source, project)
    temporal = _temporal_payload(posts, window_hours, baseline_days)
    cutoff = _now() - timedelta(hours=window_hours)
    current = [post for post in posts if (_post_time(post) or datetime.min.replace(tzinfo=timezone.utc)) >= cutoff]
    crisis = _crisis_payload(current, temporal)
    geo = _geo_payload(current)

    top_signal = temporal["signals"][0] if temporal["signals"] else None
    top_territory = geo["territories"][0] if geo["territories"] else None
    negative = sum(1 for post in current if post.sentiment == "negative")
    negative_ratio = round(negative / len(current), 2) if current else 0

    headline = "No significant acceleration detected"
    if top_signal:
        growth = top_signal["growth_score"]
        growth_text = f"x{growth}" if growth is not None else "new activity"
        headline = f"{top_signal['topic']} is the leading signal ({growth_text})"

    summary_parts = [f"{len(current)} posts analyzed in the last {window_hours}h"]
    if current:
        summary_parts.append(f"{round(negative_ratio * 100)}% negative")
    if top_territory:
        summary_parts.append(f"highest territorial activity: {top_territory['label']}")
    summary_parts.append(f"risk level: {crisis['risk_level']}")

    watch = []
    for item in temporal["signals"][:3]:
        if item["accelerating"]:
            watch.append({"type": "topic", "label": item["topic"], "growth_score": item["growth_score"]})
    for item in geo["territories"][:2]:
        if item["negative_ratio"] >= 0.5:
            watch.append({"type": "territory", "label": item["label"], "negative_ratio": item["negative_ratio"]})

    return {
        "generated_at": _now(),
        "source": source,
        "project_id": project_id,
        "project_name": project.name if project else None,
        "window_hours": window_hours,
        "headline": headline,
        "summary": "; ".join(summary_parts) + ".",
        "metrics": {
            "posts": len(current),
            "negative_ratio": negative_ratio,
            "risk_level": crisis["risk_level"],
            "alerts": crisis["total_alerts"],
            "territories": geo["total_territories"],
        },
        "leading_signal": top_signal,
        "leading_territory": top_territory,
        "watch_items": watch,
        "top_alerts": crisis["alerts"][:5],
    }
