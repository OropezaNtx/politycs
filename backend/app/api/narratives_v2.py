from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.intelligence_v2 import _posts, _project


router = APIRouter(prefix="/intelligence/v2", tags=["Intelligence V2"])

NARRATIVE_RULES = {
    "seguridad_publica": {
        "label": "Seguridad pública",
        "keywords": {"seguridad", "violencia", "crimen", "policia", "policía", "robo", "homicidio", "delito", "narco"},
    },
    "corrupcion_gobierno": {
        "label": "Corrupción y gobierno",
        "keywords": {"corrupcion", "corrupción", "gobierno", "funcionario", "contrato", "transparencia", "alcalde", "municipio"},
    },
    "movilidad_transporte": {
        "label": "Movilidad y transporte",
        "keywords": {"transporte", "metro", "movilidad", "trafico", "tráfico", "combi", "camion", "camión", "vialidad"},
    },
    "servicios_urbanos": {
        "label": "Servicios urbanos",
        "keywords": {"agua", "luz", "basura", "bache", "drenaje", "servicios", "infraestructura"},
    },
    "salud_bienestar": {
        "label": "Salud y bienestar",
        "keywords": {"salud", "hospital", "medicina", "vacuna", "imss", "issste", "enfermedad"},
    },
    "proceso_electoral": {
        "label": "Proceso electoral",
        "keywords": {"elecciones", "elección", "campaña", "voto", "partido", "candidato", "morena", "pan", "pri", "prd"},
    },
    "economia_local": {
        "label": "Economía local",
        "keywords": {"economia", "economía", "empleo", "precio", "inflacion", "inflación", "comercio", "negocio"},
    },
}


def _matches_narrative(post, keywords: set[str]) -> bool:
    text = f"{post.title or ''} {post.raw_content or ''}".lower()
    post_topics = {str(topic).lower() for topic in (post.topics or [])}
    return any(keyword in text for keyword in keywords) or bool(post_topics.intersection(keywords))


@router.get("/narratives")
def narrative_intelligence_v2(
    source: str = "all",
    project_id: int | None = None,
    db: Session = Depends(get_db),
):
    project = _project(db, project_id)
    posts = _posts(db, source, project)
    results = []

    for key, config in NARRATIVE_RULES.items():
        matched = [post for post in posts if _matches_narrative(post, config["keywords"])]
        if not matched:
            continue

        sources = Counter(post.source or "unknown" for post in matched)
        topics = Counter()
        for post in matched:
            topics.update(str(topic).lower() for topic in (post.topics or []))

        negative = sum(1 for post in matched if post.sentiment == "negative")
        political = sum(1 for post in matched if float(post.political_score or 0) > 0)
        toxic = sum(1 for post in matched if float(post.toxicity_score or 0) > 0)

        evidence = [
            {
                "id": post.id,
                "title": post.title,
                "source": post.source,
                "platform": post.platform,
                "sentiment": post.sentiment,
                "url": post.url,
                "scraped_at": post.scraped_at,
            }
            for post in sorted(matched, key=lambda item: item.scraped_at or item.created_at, reverse=True)[:8]
        ]

        total = len(matched)
        results.append({
            "key": key,
            "label": config["label"],
            "total_mentions": total,
            "negative_posts": negative,
            "political_posts": political,
            "toxic_posts": toxic,
            "negative_ratio": round(negative / total, 2) if total else 0,
            "political_ratio": round(political / total, 2) if total else 0,
            "toxic_ratio": round(toxic / total, 2) if total else 0,
            "sources": dict(sources.most_common(5)),
            "top_topics": dict(topics.most_common(5)),
            "evidence": evidence,
        })

    results.sort(key=lambda item: item["total_mentions"], reverse=True)
    return {
        "source": source,
        "project_id": project_id,
        "total_posts_analyzed": len(posts),
        "total_narratives": len(results),
        "narratives": results,
    }
