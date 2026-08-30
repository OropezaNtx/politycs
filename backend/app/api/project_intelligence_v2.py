from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.monitoring_project import MonitoringProject
from app.models.post import Post
from app.services.geo_service import detect_locations, normalize_text
from app.services.monitoring_scope_service import evaluate_post_scope, scope_matches_post
from app.api.intelligence_v2 import _temporal_payload, _crisis_payload, _geo_payload
from app.api.narratives_v2 import NARRATIVE_RULES, _matches_narrative


router = APIRouter(prefix="/intelligence/v2/project", tags=["Project Intelligence V2"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _post_time(post: Post) -> datetime | None:
    value = post.scraped_at or post.created_at
    if value and value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value


def _normalize(value: str | None) -> str:
    return normalize_text(value).strip()


def _project(db: Session, project_id: int | None) -> MonitoringProject | None:
    if project_id is None:
        return None
    project = db.query(MonitoringProject).filter(MonitoringProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _signals(post: Post, project: MonitoringProject) -> dict:
    evaluation = evaluate_post_scope(post, project)
    criteria = evaluation["criteria"]
    return {
        "source_required": bool(project.sources or []),
        "source": criteria["source"],
        "keyword_required": bool(project.keywords or []),
        "keyword": criteria["keyword"],
        "topic_required": bool(project.topics or []),
        "topic": criteria["topic"],
        "territory_required": bool(project.territories or []),
        "territory": criteria["territory"],
    }


def _matches(post: Post, project: MonitoringProject | None) -> bool:
    if project is None:
        return True
    return scope_matches_post(post, project)


def _posts(db: Session, source: str, project: MonitoringProject | None) -> list[Post]:
    query = db.query(Post)
    if source and source != "all":
        query = query.filter(Post.source == source)
    return [post for post in query.all() if _matches(post, project)]


def _window_count(posts: list[Post], hours: int) -> int:
    cutoff = _now() - timedelta(hours=hours)
    return sum(1 for post in posts if (_post_time(post) or datetime.min.replace(tzinfo=timezone.utc)) >= cutoff)


def _scope_payload(posts: list[Post], project: MonitoringProject | None) -> dict:
    dated = sorted(
        [post for post in posts if _post_time(post)],
        key=lambda post: _post_time(post),
    )
    windows = {
        "1h": _window_count(posts, 1),
        "6h": _window_count(posts, 6),
        "24h": _window_count(posts, 24),
        "7d": _window_count(posts, 168),
        "30d": _window_count(posts, 720),
    }

    recommended = None
    if windows["24h"] == 0:
        if windows["7d"] > 0:
            recommended = 168
        elif windows["30d"] > 0:
            recommended = 720

    status = "active"
    if not posts:
        status = "no_matches"
    elif windows["24h"] == 0:
        status = "historical_only"

    return {
        "status": status,
        "match_mode": (project.match_mode if project else "global") or "broad",
        "historical_posts": len(posts),
        "first_activity": _post_time(dated[0]) if dated else None,
        "last_activity": _post_time(dated[-1]) if dated else None,
        "windows": windows,
        "recommended_window_hours": recommended,
    }


def _serialize_evidence(post: Post) -> dict:
    return {
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
    }


@router.get("/scope")
def project_scope(
    source: str = "all",
    project_id: int | None = None,
    db: Session = Depends(get_db),
):
    project = _project(db, project_id)
    posts = _posts(db, source, project)

    diagnostics = None
    if project:
        all_posts = db.query(Post).all()
        all_signals = [_signals(post, project) for post in all_posts]
        diagnostics = {
            "total_database_posts": len(all_posts),
            "source_matches": sum(1 for signal in all_signals if signal["source"]),
            "keyword_matches": sum(1 for signal in all_signals if signal["keyword"] and signal["keyword_required"]),
            "topic_matches": sum(1 for signal in all_signals if signal["topic"] and signal["topic_required"]),
            "territory_matches": sum(1 for signal in all_signals if signal["territory"] and signal["territory_required"]),
        }

    return {
        "project_id": project_id,
        "project_name": project.name if project else None,
        **_scope_payload(posts, project),
        "diagnostics": diagnostics,
    }


@router.get("/temporal")
def temporal(
    source: str = "all",
    project_id: int | None = None,
    window_hours: int = Query(default=24, ge=1, le=720),
    baseline_days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    project = _project(db, project_id)
    posts = _posts(db, source, project)
    payload = _temporal_payload(posts, window_hours, baseline_days)
    return {"source": source, "project_id": project_id, "scope": _scope_payload(posts, project), **payload}


@router.get("/crisis")
def crisis(
    source: str = "all",
    project_id: int | None = None,
    window_hours: int = Query(default=24, ge=1, le=720),
    baseline_days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    project = _project(db, project_id)
    posts = _posts(db, source, project)
    temporal_payload = _temporal_payload(posts, window_hours, baseline_days)
    cutoff = _now() - timedelta(hours=window_hours)
    current = [post for post in posts if (_post_time(post) or datetime.min.replace(tzinfo=timezone.utc)) >= cutoff]
    return {
        "source": source,
        "project_id": project_id,
        "window_hours": window_hours,
        "scope": _scope_payload(posts, project),
        **_crisis_payload(current, temporal_payload),
    }


@router.get("/geo")
def geo(
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
        "scope": _scope_payload(posts, project),
        **_geo_payload(current),
    }


@router.get("/narratives")
def narratives(
    source: str = "all",
    project_id: int | None = None,
    window_hours: int = Query(default=168, ge=1, le=720),
    db: Session = Depends(get_db),
):
    project = _project(db, project_id)
    posts = _posts(db, source, project)
    cutoff = _now() - timedelta(hours=window_hours)
    current = [post for post in posts if (_post_time(post) or datetime.min.replace(tzinfo=timezone.utc)) >= cutoff]
    results = []

    for key, config in NARRATIVE_RULES.items():
        matched = [post for post in current if _matches_narrative(post, config["keywords"])]
        if not matched:
            continue
        sources = Counter(post.source or "unknown" for post in matched)
        topics = Counter()
        for post in matched:
            topics.update(str(topic).lower() for topic in (post.topics or []))
        total = len(matched)
        negative = sum(1 for post in matched if post.sentiment == "negative")
        political = sum(1 for post in matched if float(post.political_score or 0) > 0)
        toxic = sum(1 for post in matched if float(post.toxicity_score or 0) > 0)
        results.append({
            "key": key,
            "label": config["label"],
            "total_mentions": total,
            "negative_ratio": round(negative / total, 2),
            "political_ratio": round(political / total, 2),
            "toxic_ratio": round(toxic / total, 2),
            "sources": dict(sources.most_common(5)),
            "top_topics": dict(topics.most_common(5)),
            "evidence": [_serialize_evidence(post) for post in sorted(matched, key=lambda item: _post_time(item) or datetime.min.replace(tzinfo=timezone.utc), reverse=True)[:8]],
        })

    results.sort(key=lambda item: item["total_mentions"], reverse=True)
    return {
        "source": source,
        "project_id": project_id,
        "total_posts_analyzed": len(current),
        "total_narratives": len(results),
        "scope": _scope_payload(posts, project),
        "narratives": results,
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
    topic_value = _normalize(topic) if topic else None
    territory_value = _normalize(territory) if territory else None
    selected = []

    for post in sorted(posts, key=lambda item: _post_time(item) or datetime.min.replace(tzinfo=timezone.utc), reverse=True):
        if topic_value and topic_value not in {_normalize(str(value)) for value in (post.topics or [])}:
            continue
        if territory_value:
            locations = detect_locations(f"{post.title or ''} {post.raw_content or ''}")
            detected = {_normalize(str(item["key"])) for item in locations} | {_normalize(str(item["label"])) for item in locations}
            if territory_value not in detected:
                continue
        selected.append(_serialize_evidence(post))
        if len(selected) >= limit:
            break

    return {
        "topic": topic,
        "territory": territory,
        "project_id": project_id,
        "scope": _scope_payload(posts, project),
        "total_returned": len(selected),
        "posts": selected,
    }


@router.get("/brief")
def brief(
    source: str = "all",
    project_id: int | None = None,
    window_hours: int = Query(default=24, ge=1, le=720),
    baseline_days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    project = _project(db, project_id)
    posts = _posts(db, source, project)
    scope = _scope_payload(posts, project)
    temporal_payload = _temporal_payload(posts, window_hours, baseline_days)
    cutoff = _now() - timedelta(hours=window_hours)
    current = [post for post in posts if (_post_time(post) or datetime.min.replace(tzinfo=timezone.utc)) >= cutoff]
    crisis_payload = _crisis_payload(current, temporal_payload)
    geo_payload = _geo_payload(current)

    top_signal = temporal_payload["signals"][0] if temporal_payload["signals"] else None
    top_territory = geo_payload["territories"][0] if geo_payload["territories"] else None
    negative = sum(1 for post in current if post.sentiment == "negative")
    negative_ratio = round(negative / len(current), 2) if current else 0

    if current:
        headline = "Active public conversation detected"
        if top_signal:
            growth = top_signal["growth_score"]
            headline = f"{top_signal['topic']} is the leading signal ({'x' + str(growth) if growth is not None else 'new activity'})"
        summary = f"{len(current)} posts analyzed in the last {window_hours}h; {round(negative_ratio * 100)}% negative; risk level: {crisis_payload['risk_level']}."
    elif scope["historical_posts"]:
        headline = "No recent activity in the selected window"
        last = scope["last_activity"]
        last_text = last.isoformat() if last else "unknown"
        recommendation = scope["recommended_window_hours"]
        extra = f" Try {int(recommendation / 24)} days." if recommendation else ""
        summary = f"This project has {scope['historical_posts']} historical matches, but none in the last {window_hours}h. Last activity: {last_text}.{extra}"
    else:
        headline = "No content matches the current monitoring scope"
        summary = "The project filters currently return no matching posts. Review keywords, topics, territories or switch to Broad matching."

    watch = []
    for item in temporal_payload["signals"][:3]:
        if item["accelerating"]:
            watch.append({"type": "topic", "label": item["topic"], "growth_score": item["growth_score"]})
    for item in geo_payload["territories"][:2]:
        if item["negative_ratio"] >= 0.5:
            watch.append({"type": "territory", "label": item["label"], "negative_ratio": item["negative_ratio"]})

    return {
        "generated_at": _now(),
        "source": source,
        "project_id": project_id,
        "project_name": project.name if project else None,
        "window_hours": window_hours,
        "headline": headline,
        "summary": summary,
        "scope": scope,
        "metrics": {
            "posts": len(current),
            "negative_ratio": negative_ratio,
            "risk_level": crisis_payload["risk_level"],
            "alerts": crisis_payload["total_alerts"],
            "territories": geo_payload["total_territories"],
        },
        "leading_signal": top_signal,
        "leading_territory": top_territory,
        "watch_items": watch,
        "top_alerts": crisis_payload["alerts"][:5],
    }
