from __future__ import annotations

from collections import Counter
from difflib import get_close_matches
from typing import Any
import unicodedata

from app.models.post import Post
from app.services.geo_service import detect_locations, GEO_KEYWORDS, normalize_text


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


def post_scope_facts(post: Post) -> dict:
    text_parts = [post.title or "", post.raw_content or "", post.tags or ""]
    text_parts.extend(str(value) for value in (post.keywords or []))
    text_parts.extend(_flatten_entities(post.entities))
    normalized_text = _norm(" ".join(text_parts))

    topics = _norm_set(post.topics)
    post_keywords = _norm_set(post.keywords)
    source = _norm(post.source)

    locations = detect_locations(f"{post.title or ''} {post.raw_content or ''}")
    territory_values = set()
    for location in locations:
        territory_values.add(_norm(location.get("key")))
        territory_values.add(_norm(location.get("label")))
        territory_values.add(_norm(location.get("state")))

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

    criterion_matches = {
        "source": source_match,
        "keyword": keyword_match,
        "topic": topic_match,
        "territory": territory_match,
    }

    configured_non_source = []
    if keywords:
        configured_non_source.append(keyword_match)
    if topics:
        configured_non_source.append(topic_match)
    if territories:
        configured_non_source.append(territory_match)

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
        "criteria": criterion_matches,
        "facts": facts,
    }


def scope_matches_post(post: Post, scope) -> bool:
    return evaluate_post_scope(post, scope)["matched"]


def preview_scope(posts: list[Post], scope, limit: int = 8) -> dict:
    diagnostics = Counter()
    matched_posts = []
    unmatched_examples = []

    for post in posts:
        evaluation = evaluate_post_scope(post, scope)
        for criterion, value in evaluation["criteria"].items():
            if value:
                diagnostics[f"{criterion}_match"] += 1
            else:
                diagnostics[f"{criterion}_miss"] += 1

        if evaluation["matched"]:
            matched_posts.append((post, evaluation))
        elif len(unmatched_examples) < 5:
            unmatched_examples.append({
                "id": post.id,
                "title": post.title,
                "source": post.source,
                "criteria": evaluation["criteria"],
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
            "topics": post.topics or [],
            "keywords": post.keywords or [],
        })

    suggestions = build_scope_suggestions(posts, scope)

    return {
        "total_posts_scanned": len(posts),
        "total_matches": len(matched_posts),
        "match_mode": getattr(scope, "match_mode", "broad") or "broad",
        "diagnostics": {
            "source_matches": diagnostics["source_match"],
            "keyword_matches": diagnostics["keyword_match"],
            "topic_matches": diagnostics["topic_match"],
            "territory_matches": diagnostics["territory_match"],
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
        for location in facts["locations"]:
            label = location.get("label")
            if label:
                territory_counts[label] += 1

    configured_terms = []
    configured_terms.extend(getattr(scope, "keywords", []) or [])
    configured_terms.extend(getattr(scope, "topics", []) or [])
    configured_terms.extend(getattr(scope, "territories", []) or [])
    configured_norm = {_norm(value) for value in configured_terms if _norm(value)}

    candidate_terms = set()
    candidate_terms.update(topic_counts.keys())
    candidate_terms.update(keyword_counts.keys())
    candidate_terms.update(territory_counts.keys())
    candidate_terms.update(location["label"] for location in GEO_KEYWORDS.values())

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
