from __future__ import annotations

from collections import Counter
from difflib import get_close_matches
from typing import Any

from app.models.post import Post
from app.services.geo_service import GEO_KEYWORDS, detect_locations, normalize_text


def _norm(value: Any) -> str:
    if value is None:
        return ""
    return normalize_text(str(value)).strip()


def _norm_set(values) -> set[str]:
    return {_norm(value) for value in (values or []) if _norm(value)}


def _flatten_entities(entities) -> list[str]:
    values = []
    if isinstance(entities, dict):
        for key, value in entities.items():
            values.append(str(key))
            if isinstance(value, list):
                values.extend(str(item) for item in value)
            elif value is not None:
                values.append(str(value))
    elif isinstance(entities, list):
        for item in entities:
            if isinstance(item, dict):
                values.extend(str(value) for value in item.values() if value is not None)
            elif item is not None:
                values.append(str(item))
    elif entities:
        values.append(str(entities))
    return values


def _location_terms(location: dict) -> set[str]:
    terms = {
        _norm(location.get("key")),
        _norm(location.get("label")),
        _norm(location.get("state")),
    }
    config = GEO_KEYWORDS.get(location.get("key"), {})
    terms.update(_norm(alias) for alias in config.get("aliases", []))
    return {value for value in terms if value}


def post_scope_facts(post: Post) -> dict:
    text_parts = [post.title or "", post.raw_content or "", post.tags or ""]
    text_parts.extend(str(value) for value in (post.keywords or []))
    text_parts.extend(_flatten_entities(post.entities))
    normalized_text = _norm(" ".join(text_parts))

    topics = _norm_set(post.topics)
    post_keywords = _norm_set(post.keywords)
    source = _norm(post.source)

    raw_locations = detect_locations(f"{post.title or ''} {post.raw_content or ''}")
    semantic_locations = detect_locations(" ".join(text_parts))
    locations_by_key = {}
    for location in [*raw_locations, *semantic_locations]:
        locations_by_key[location.get("key") or location.get("label")] = location
    locations = list(locations_by_key.values())

    territory_values = set()
    for location in locations:
        territory_values.update(_location_terms(location))

    # If an NLP keyword/entity contains a known geographic alias, keep it as a
    # territorial fact even when the raw article body did not contain the term.
    for key, config in GEO_KEYWORDS.items():
        aliases = {_norm(alias) for alias in config.get("aliases", [])}
        aliases.add(_norm(key))
        aliases.add(_norm(config.get("label")))
        if any(alias and alias in normalized_text for alias in aliases):
            territory_values.update({
                _norm(key),
                _norm(config.get("label")),
                _norm(config.get("state")),
                *aliases,
            })
            if key not in locations_by_key:
                locations.append({
                    "key": key,
                    "label": config.get("label"),
                    "type": config.get("type"),
                    "state": config.get("state"),
                    "lat": config.get("lat"),
                    "lng": config.get("lng"),
                    "inferred": True,
                })

    return {
        "text": normalized_text,
        "topics": topics,
        "keywords": post_keywords,
        "source": source,
        "territories": {value for value in territory_values if value},
        "locations": locations,
    }


def evaluate_post_scope(post: Post, scope) -> dict:
    sources = _norm_set(getattr(scope, "sources", []))
    keywords = _norm_set(getattr(scope, "keywords", []))
    topics = _norm_set(getattr(scope, "topics", []))
    territories = _norm_set(getattr(scope, "territories", []))
    match_mode = getattr(scope, "match_mode", "broad") or "broad"

    facts = post_scope_facts(post)

    source_match = True if not sources else facts["source"] in sources
    keyword_match = True if not keywords else any(
        keyword in facts["text"] or keyword in facts["keywords"]
        for keyword in keywords
    )
    topic_match = True if not topics else bool(facts["topics"].intersection(topics))
    territory_match = True if not territories else bool(facts["territories"].intersection(territories)) or any(
        territory and territory in facts["text"] for territory in territories
    )

    configured = {
        "source": bool(sources),
        "keyword": bool(keywords),
        "topic": bool(topics),
        "territory": bool(territories),
    }
    criterion_matches = {
        "source": source_match,
        "keyword": keyword_match,
        "topic": topic_match,
        "territory": territory_match,
    }

    configured_non_source = [
        criterion_matches[name]
        for name in ("keyword", "topic", "territory")
        if configured[name]
    ]

    if not source_match:
        matched = False
    elif not configured_non_source:
        matched = True
    elif match_mode == "strict":
        matched = all(configured_non_source)
    else:
        matched = any(configured_non_source)

    return {
        "matched": matched,
        "match_mode": match_mode,
        "configured": configured,
        "criteria": criterion_matches,
        "facts": facts,
    }


def scope_matches_post(post: Post, scope) -> bool:
    return evaluate_post_scope(post, scope)["matched"]


def preview_scope(posts: list[Post], scope, limit: int = 8) -> dict:
    diagnostics = Counter()
    matched_posts = []
    unmatched_examples = []

    configured = {
        "source": bool(getattr(scope, "sources", []) or []),
        "keyword": bool(getattr(scope, "keywords", []) or []),
        "topic": bool(getattr(scope, "topics", []) or []),
        "territory": bool(getattr(scope, "territories", []) or []),
    }

    for post in posts:
        evaluation = evaluate_post_scope(post, scope)
        for criterion, value in evaluation["criteria"].items():
            if not evaluation["configured"][criterion]:
                continue
            diagnostics[f"{criterion}_match" if value else f"{criterion}_miss"] += 1

        if evaluation["matched"]:
            matched_posts.append((post, evaluation))
        elif len(unmatched_examples) < 5:
            unmatched_examples.append({
                "id": post.id,
                "title": post.title,
                "source": post.source,
                "criteria": evaluation["criteria"],
                "configured": evaluation["configured"],
            })

    matched_posts.sort(key=lambda item: item[0].scraped_at or item[0].created_at, reverse=True)

    examples = []
    for post, evaluation in matched_posts[:limit]:
        examples.append({
            "id": post.id,
            "title": post.title,
            "source": post.source,
            "platform": post.platform,
            "url": post.url,
            "scraped_at": post.scraped_at,
            "criteria": evaluation["criteria"],
            "configured": evaluation["configured"],
            "topics": post.topics or [],
            "keywords": post.keywords or [],
            "detected_locations": evaluation["facts"]["locations"],
        })

    suggestions = build_scope_suggestions(posts, scope)

    def metric(name: str):
        return diagnostics[f"{name}_match"] if configured[name] else None

    return {
        "total_posts_scanned": len(posts),
        "total_matches": len(matched_posts),
        "match_mode": getattr(scope, "match_mode", "broad") or "broad",
        "configured_criteria": configured,
        "diagnostics": {
            "source_matches": metric("source"),
            "keyword_matches": metric("keyword"),
            "topic_matches": metric("topic"),
            "territory_matches": metric("territory"),
        },
        "examples": examples,
        "unmatched_examples": unmatched_examples,
        "suggestions": suggestions,
    }


def build_scope_suggestions(posts: list[Post], scope) -> dict:
    topic_counts = Counter()
    keyword_counts = Counter()
    source_counts = Counter()
    territory_counts = Counter()

    for post in posts:
        facts = post_scope_facts(post)
        if facts["source"]:
            source_counts[post.source or facts["source"]] += 1
        for value in post.topics or []:
            if value:
                topic_counts[str(value)] += 1
        for value in post.keywords or []:
            if value:
                keyword_counts[str(value)] += 1
        seen_locations = set()
        for location in facts["locations"]:
            label = location.get("label")
            if label and label not in seen_locations:
                territory_counts[label] += 1
                seen_locations.add(label)

    configured_terms = []
    configured_terms.extend(getattr(scope, "keywords", []) or [])
    configured_terms.extend(getattr(scope, "topics", []) or [])
    configured_terms.extend(getattr(scope, "territories", []) or [])
    configured_norm = {_norm(value) for value in configured_terms if _norm(value)}

    candidate_terms = set(topic_counts.keys())
    candidate_terms.update(keyword_counts.keys())
    candidate_terms.update(territory_counts.keys())

    normalized_lookup = {_norm(value): value for value in candidate_terms if _norm(value)}
    close = []
    for term in configured_norm:
        for match in get_close_matches(term, list(normalized_lookup.keys()), n=4, cutoff=0.55):
            value = normalized_lookup[match]
            if value not in close:
                close.append(value)

    return {
        "related_terms": close[:8],
        "top_topics": [name for name, _ in topic_counts.most_common(8)],
        "top_keywords": [name for name, _ in keyword_counts.most_common(8)],
        "available_territories": [name for name, _ in territory_counts.most_common(8)],
        "top_sources": [name for name, _ in source_counts.most_common(8)],
    }
