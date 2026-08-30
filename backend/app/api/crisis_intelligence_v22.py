from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.monitoring_scope_service import post_scope_facts
from app.api.project_intelligence_v2 import (
    _now,
    _post_time,
    _posts,
    _project,
    _scope_payload,
    _temporal_payload,
)

router = APIRouter(prefix="/intelligence/v2/project", tags=["Crisis Intelligence V2.2"])

SENSITIVE_TOPICS = {
    "seguridad", "corrupcion", "corrupción", "violencia", "crimen",
    "salud", "agua", "transporte", "elecciones", "economia", "economía",
}

CONFIDENCE_POINTS = {"high": 1.0, "medium": 0.55, "low": 0.2}


def _normalized_topics(post) -> set[str]:
    return {str(value).lower() for value in (post.topics or [])}


def _territorial_signal(post) -> dict:
    facts = post_scope_facts(post)
    geo = facts.get("geo_evidence", [])
    if not geo:
        return {"points": 0.0, "locations": [], "best_confidence": None}

    rank = {"low": 1, "medium": 2, "high": 3}
    best = max(geo, key=lambda item: rank.get(item.get("confidence", "low"), 1))
    confidence = best.get("confidence", "low")
    points = CONFIDENCE_POINTS.get(confidence, 0.2)
    return {
        "points": points,
        "best_confidence": confidence,
        "locations": [
            {
                "key": item.get("key"),
                "label": item.get("label"),
                "state": item.get("state"),
                "confidence": item.get("confidence"),
                "evidence": item.get("evidence", []),
            }
            for item in geo
        ],
    }


def _score_post(post, growth_by_topic: dict[str, float], source_diversity: dict[str, int]) -> dict:
    score = 0.0
    factors = []
    topics = _normalized_topics(post)

    if post.sentiment == "negative":
        score += 1.4
        factors.append({"factor": "negative_sentiment", "points": 1.4, "explanation": "Negative sentiment increases escalation potential."})

    political = float(post.political_score or 0)
    if political >= 0.6:
        points = round(min(1.6, political * 1.6), 2)
        score += points
        factors.append({"factor": "political_relevance", "points": points, "value": political, "explanation": "High political relevance increases public-impact potential."})

    toxicity = float(post.toxicity_score or 0)
    if toxicity >= 0.25:
        points = round(min(1.2, toxicity * 1.5), 2)
        score += points
        factors.append({"factor": "toxicity", "points": points, "value": toxicity, "explanation": "Toxic language can indicate conflict or polarization."})

    sensitive = topics.intersection(SENSITIVE_TOPICS)
    if sensitive:
        points = round(min(1.8, 0.6 * len(sensitive)), 2)
        score += points
        factors.append({"factor": "sensitive_topics", "points": points, "topics": sorted(sensitive), "explanation": "The post intersects topics commonly associated with public risk."})

    growth_values = [growth_by_topic[t] for t in topics if t in growth_by_topic and growth_by_topic[t] is not None]
    if growth_values:
        growth = max(growth_values)
        if growth >= 1.5:
            points = round(min(2.2, 0.9 * (growth - 1)), 2)
            score += points
            factors.append({"factor": "topic_acceleration", "points": points, "growth": growth, "explanation": "The topic is growing faster than its recent baseline."})

    diversity = max((source_diversity.get(topic, 0) for topic in topics), default=0)
    if diversity >= 2:
        points = round(min(1.0, diversity * 0.2), 2)
        score += points
        factors.append({"factor": "source_diversity", "points": points, "sources": diversity, "explanation": "The signal appears across multiple sources instead of a single outlet."})

    territorial = _territorial_signal(post)
    if territorial["points"] > 0:
        score += territorial["points"]
        factors.append({
            "factor": "territorial_confidence",
            "points": territorial["points"],
            "confidence": territorial["best_confidence"],
            "locations": [item["label"] for item in territorial["locations"]],
            "explanation": "A geolocated signal increases confidence that the issue is territorially actionable.",
        })

    score = round(score, 2)
    severity = "low"
    if score >= 6.5:
        severity = "high"
    elif score >= 4.0:
        severity = "medium"

    return {
        "id": post.id,
        "title": post.title,
        "source": post.source,
        "platform": post.platform,
        "url": post.url,
        "scraped_at": post.scraped_at,
        "sentiment": post.sentiment,
        "topics": list(post.topics or []),
        "risk_score": score,
        "severity": severity,
        "factors": factors,
        "territorial_evidence": territorial["locations"],
    }


@router.get("/crisis22")
def crisis_v22(
    source: str = "all",
    project_id: int | None = None,
    window_hours: int = Query(default=24, ge=1, le=720),
    baseline_days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    project = _project(db, project_id)
    posts = _posts(db, source, project)
    temporal = _temporal_payload(posts, window_hours, baseline_days)
    cutoff = _now() - timedelta(hours=window_hours)
    current = [post for post in posts if (_post_time(post) or datetime.min.replace(tzinfo=timezone.utc)) >= cutoff]

    growth_by_topic = {item["topic"]: item.get("growth_score") for item in temporal.get("signals", [])}
    topic_sources = defaultdict(set)
    for post in current:
        for topic in _normalized_topics(post):
            topic_sources[topic].add(post.source or "unknown")
    source_diversity = {topic: len(values) for topic, values in topic_sources.items()}

    scored = [_score_post(post, growth_by_topic, source_diversity) for post in current]
    alerts = [item for item in scored if item["risk_score"] >= 3.0]
    alerts.sort(key=lambda item: item["risk_score"], reverse=True)

    high = sum(1 for item in alerts if item["severity"] == "high")
    medium = sum(1 for item in alerts if item["severity"] == "medium")
    accelerating_topics = sum(1 for item in temporal.get("signals", []) if item.get("accelerating"))
    high_conf_geo = sum(
        1 for item in alerts
        if any(location.get("confidence") == "high" for location in item.get("territorial_evidence", []))
    )

    overall_score = round(
        min(
            10.0,
            (high * 1.8)
            + (medium * 0.7)
            + min(len(alerts) * 0.15, 2.0)
            + min(accelerating_topics * 0.6, 1.8)
            + min(high_conf_geo * 0.25, 1.2),
        ),
        2,
    )
    risk_level = "low"
    if overall_score >= 6.0:
        risk_level = "high"
    elif overall_score >= 3.0:
        risk_level = "medium"

    factor_counts = Counter()
    for alert in alerts:
        for factor in alert["factors"]:
            factor_counts[factor["factor"]] += 1

    return {
        "source": source,
        "project_id": project_id,
        "window_hours": window_hours,
        "baseline_days": baseline_days,
        "posts_analyzed": len(current),
        "scope": _scope_payload(posts, project),
        "risk_level": risk_level,
        "overall_risk_score": overall_score,
        "total_alerts": len(alerts),
        "high_risk_alerts": high,
        "medium_risk_alerts": medium,
        "accelerating_topics": accelerating_topics,
        "high_confidence_territorial_alerts": high_conf_geo,
        "factor_distribution": dict(factor_counts),
        "alerts": alerts[:30],
    }
