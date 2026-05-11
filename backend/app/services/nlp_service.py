import re
import spacy
from langdetect import detect
from collections import Counter

from app.core.political_categories import POLITICAL_TOPICS


nlp = spacy.load("es_core_news_sm")


POSITIVE_WORDS = {
    "bueno", "excelente", "mejor", "seguro", "apoyo", "avance",
    "solución", "arreglar", "mejorar", "positivo", "bien", "logro",
    "resuelto", "beneficio"
}

NEGATIVE_WORDS = {
    "malo", "inseguridad", "robo", "violencia", "corrupción",
    "problema", "queja", "abandono", "peligro", "falta", "mal",
    "denuncia", "molestia", "asalto", "fraude", "desabasto"
}

TOXIC_WORDS = {
    "odio", "basura", "rata", "corrupto", "inútil", "imbécil",
    "estúpido", "maldito", "ratero"
}

POLITICAL_WORDS = {
    "gobierno", "presidente", "presidenta", "diputado", "senador",
    "alcalde", "regidor", "municipio", "campaña", "partido",
    "candidato", "elección", "voto", "seguridad", "obra pública",
    "corrupción", "policía", "ayuntamiento"
}


def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"http\S+", " ", text)
    text = re.sub(r"[^a-záéíóúñü0-9#@ ]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def detect_language(text: str) -> str:
    try:
        return detect(text)
    except Exception:
        return "unknown"


def extract_keywords(text: str, limit: int = 12) -> list[str]:
    doc = nlp(normalize_text(text))

    words = [
        token.lemma_
        for token in doc
        if not token.is_stop
        and not token.is_punct
        and not token.like_num
        and len(token.text.strip()) > 3
        and token.pos_ in {"NOUN", "PROPN", "ADJ", "VERB"}
    ]

    return [word for word, _ in Counter(words).most_common(limit)]


def extract_entities(text: str) -> list[dict]:
    doc = nlp(text)

    return [
        {
            "text": ent.text,
            "label": ent.label_
        }
        for ent in doc.ents
    ]


def extract_hashtags(text: str) -> list[str]:
    return sorted(set(re.findall(r"#\w+", text.lower())))


def extract_mentions(text: str) -> list[str]:
    return sorted(set(re.findall(r"@\w+", text.lower())))


def analyze_sentiment(text: str) -> str:
    text_lower = normalize_text(text)

    positive_count = sum(1 for word in POSITIVE_WORDS if word in text_lower)
    negative_count = sum(1 for word in NEGATIVE_WORDS if word in text_lower)

    if positive_count > negative_count:
        return "positive"

    if negative_count > positive_count:
        return "negative"

    return "neutral"


def classify_political_topics(text: str, keywords: list[str]) -> dict:
    text_lower = normalize_text(text)
    keyword_set = set(keywords)

    scores = {}

    for topic, terms in POLITICAL_TOPICS.items():
        matches = 0

        for term in terms:
            term_lower = term.lower()

            if term_lower in text_lower or term_lower in keyword_set:
                matches += 1

        if matches > 0:
            scores[topic] = {
                "matches": matches,
                "score": round(min(matches / max(len(terms), 1), 1.0), 2)
            }

    return scores


def detect_topics(text: str, keywords: list[str]) -> list[str]:
    topic_scores = classify_political_topics(text, keywords)

    if not topic_scores:
        return ["general"]

    return sorted(
        topic_scores.keys(),
        key=lambda topic: topic_scores[topic]["score"],
        reverse=True
    )


def calculate_political_score(text: str, keywords: list[str]) -> float:
    text_lower = normalize_text(text)
    topic_scores = classify_political_topics(text, keywords)

    political_matches = sum(1 for word in POLITICAL_WORDS if word in text_lower)
    topic_matches = sum(data["matches"] for data in topic_scores.values())

    score = (political_matches * 0.15) + (topic_matches * 0.12)

    return round(min(score, 1.0), 2)


def calculate_toxicity_score(text: str) -> float:
    text_lower = normalize_text(text)
    matches = sum(1 for word in TOXIC_WORDS if word in text_lower)

    return round(min(matches / 5, 1.0), 2)


def analyze_text(text: str) -> dict:
    if not text or not text.strip():
        return {
            "detected_language": "unknown",
            "sentiment": "neutral",
            "keywords": [],
            "topics": ["general"],
            "entities": [],
            "political_score": 0.0,
            "toxicity_score": 0.0
        }

    keywords = extract_keywords(text)
    topics = detect_topics(text, keywords)

    return {
        "detected_language": detect_language(text),
        "sentiment": analyze_sentiment(text),
        "keywords": keywords,
        "topics": topics,
        "entities": extract_entities(text),
        "political_score": calculate_political_score(text, keywords),
        "toxicity_score": calculate_toxicity_score(text)
    }
