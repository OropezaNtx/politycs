import time
import requests


API_URL = "http://127.0.0.1:8000/posts/"

SUBREDDITS = [
    "mexico",
    "MexicoCity",
    "politica",
]

KEYWORDS = [
    "seguridad",
    "agua",
    "transporte",
    "corrupción",
    "gobierno",
    "elecciones",
    "alcaldía",
    "presidente",
]


HEADERS = {
    "User-Agent": "PolitycsIntelligenceBot/0.1 by OropezaNtx"
}


def send_post(payload):
    try:
        response = requests.post(API_URL, json=payload, timeout=10)

        print(response.status_code)
        print(response.json())

    except Exception as error:
        print(f"Error enviando post a API: {error}")


def collect_from_subreddit(subreddit, keyword, limit=10):
    url = f"https://www.reddit.com/r/{subreddit}/search.json"

    params = {
        "q": keyword,
        "restrict_sr": "1",
        "sort": "new",
        "limit": limit,
    }

    print(f"\nBuscando en r/{subreddit}: {keyword}")

    try:
        response = requests.get(
            url,
            headers=HEADERS,
            params=params,
            timeout=15,
        )

        if response.status_code != 200:
            print(f"Error Reddit {response.status_code}: {response.text[:200]}")
            return

        data = response.json()
        posts = data.get("data", {}).get("children", [])

        print(f"Posts encontrados: {len(posts)}")

        for item in posts:
            post = item.get("data", {})

            title = post.get("title") or ""
            selftext = post.get("selftext") or ""
            permalink = post.get("permalink") or ""
            reddit_url = f"https://www.reddit.com{permalink}"

            raw_content = f"{title}\n\n{selftext}".strip()

            payload = {
                "source": "reddit",
                "platform": subreddit,
                "title": title,
                "url": reddit_url,
                "raw_content": raw_content,
                "language": "unknown",
                "tags": f"reddit,{subreddit},{keyword}",
            }

            send_post(payload)

            time.sleep(1)

    except Exception as error:
        print(f"Error recolectando Reddit: {error}")


def main():
    for subreddit in SUBREDDITS:
        for keyword in KEYWORDS:
            collect_from_subreddit(subreddit, keyword, limit=5)
            time.sleep(2)


if __name__ == "__main__":
    main()
