import unicodedata


GEO_KEYWORDS = {
    "chimalhuacan": {
        "label": "Chimalhuacán",
        "type": "municipio",
        "state": "Estado de México",
        "lat": 19.421,
        "lng": -98.950,
        "aliases": [
            "chimalhuacan",
            "chimalhuacán",
        ],
    },
    "nezahualcoyotl": {
        "label": "Nezahualcóyotl",
        "type": "municipio",
        "state": "Estado de México",
        "lat": 19.400,
        "lng": -99.014,
        "aliases": [
            "nezahualcoyotl",
            "nezahualcóyotl",
            "neza",
        ],
    },
    "ecatepec": {
        "label": "Ecatepec",
        "type": "municipio",
        "state": "Estado de México",
        "lat": 19.601,
        "lng": -99.050,
        "aliases": [
            "ecatepec",
        ],
    },
    "texcoco": {
        "label": "Texcoco",
        "type": "municipio",
        "state": "Estado de México",
        "lat": 19.511,
        "lng": -98.882,
        "aliases": [
            "texcoco",
        ],
    },
    "iztapalapa": {
        "label": "Iztapalapa",
        "type": "alcaldia",
        "state": "CDMX",
        "lat": 19.357,
        "lng": -99.093,
        "aliases": [
            "iztapalapa",
        ],
    },
    "cdmx": {
        "label": "CDMX",
        "type": "estado",
        "state": "CDMX",
        "lat": 19.4326,
        "lng": -99.1332,
        "aliases": [
            "cdmx",
            "ciudad de mexico",
            "ciudad de méxico",
        ],
    },
}


def normalize_text(text: str | None) -> str:
    if not text:
        return ""

    text = text.lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(
        char for char in text
        if unicodedata.category(char) != "Mn"
    )

    return text


def detect_locations(text: str | None) -> list[dict]:
    normalized = normalize_text(text)
    detected = []

    for key, location in GEO_KEYWORDS.items():
        for alias in location["aliases"]:
            normalized_alias = normalize_text(alias)

            if normalized_alias in normalized:
                detected.append({
                    "key": key,
                    "label": location["label"],
                    "type": location["type"],
                    "state": location["state"],
                    "lat": location["lat"],
                    "lng": location["lng"],
                })
                break

    return detected