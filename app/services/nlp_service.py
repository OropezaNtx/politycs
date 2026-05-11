import spacy
from langdetect import detect
from collections import Counter


nlp = spacy.load("es_core_news_sm")


POSITIVE_WORDS = {
    "bueno", "excelente", "mejor", "seguro", "apoyo", "avance",
    "solución", "arreglar", "mejorar", "positivo", "bien", "logro"
}

NEGATIVE_WORDS = {
    "malo", "inseguridad", "robo", "violencia", "corrupción",
    "problema", "queja", "abandono", "peligro", "falta", "mal",
    "denuncia", "molestia"
}

POLITICAL_WORDS = {
    "gobierno", "presidente", "presidenta", "diputado", "senador",
    "alcalde", "regidor", "municipio", "campaña", "partido",
    "candidato", "elección", "voto", "seguridad", "obra pública"
}

TOXIC_WORDS = {
    "odio", "basura", "rata", "corrupto", "inútil", "imbécil",
    "estúpido", "maldito"
}


def detect_language(text: str) -> str:
    try:
        return detect(text)
    except Exception:
        return "unknown"


def extract_keywords(text: str, limit: int = 10) -> list[str]:
    doc = nlp(text.lower())

    words = [
        token.lemma_
        for token in doc
        if not token.is_stop
        and not token.is_punct
        and not token.like_num
        and len(token.text.strip()) > 3
        and token.pos_ in {"NOUN", "PROPN", "ADJ", "VERB"}
    ]

    most_common = Counter(words).most_common(limit)
    return [word for word, _ in most_common]


def extract_entities(text: str) -> list[dict]:
    doc = nlp(text)

    return [
        {
            "text": ent.text,
            "label": ent.label_
        }
        for ent in doc.ents
    ]


def analyze_sentiment(text: str) -> str:
    text_lower = text.lower()

    positive_count = sum(1 for word in POSITIVE_WORDS if word in text_lower)
    negative_count = sum(1 for word in NEGATIVE_WORDS if word in text_lower)

    if positive_count > negative_count:
        return "positive"

    if negative_count > positive_count:
        return "negative"

    return "neutral"


def calculate_political_score(text: str) -> float:
    text_lower = text.lower()
    matches = sum(1 for word in POLITICAL_WORDS if word in text_lower)
    return round(min(matches / 5, 1.0), 2)


def calculate_toxicity_score(text: str) -> float:
    text_lower = text.lower()
    matches = sum(1 for word in TOXIC_WORDS if word in text_lower)
    return round(min(matches / 5, 1.0), 2)


def detect_topics(keywords: list[str]) -> list[str]:
    topics = []

    security_terms = {"seguridad", "robo", "violencia", "peligro", "policía"}
    infrastructure_terms = {"calle", "avenida", "obra", "bache", "luz", "agua", "drenaje"}
    politics_terms = {"gobierno", "regidor", "alcalde", "candidato", "partido", "voto"}

    keyword_set = set(keywords)

    if keyword_set & security_terms:
        topics.append("seguridad")

    if keyword_set & infrastructure_terms:
        topics.append("infraestructura")

    if keyword_set & politics_terms:
        topics.app

    if not topics:
        topics.append("general")

    return topics


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

    return {
        "detected_language": detect_language(text),
        "sentiment": analyze_sentiment(text),
        "keywords": keywords,
        "topics": detect_topics(keywords),
        "entities": extract_entities(text),
        "political_score": calculate_political_score(text),
        "toxicity_score": calculate_toxicity_score(text)
    }
