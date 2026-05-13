from playwright.sync_api import sync_playwright
import requests


API_URL = "http://172.17.0.1:8000/posts/"


def send_post(title, url):
    payload = {
        "source": "hacker_news",
        "platform": "news_site",
        "title": title,
        "url": url,
        "raw_content": title,
        "language": "unknown",
        "tags": "tech,news",
    }

    response = requests.post(API_URL, json=payload)

    print(response.status_code)
    print(response.json())


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto("https://news.ycombinator.com")

        posts = page.locator(".athing")
        count = posts.count()

        print(f"Posts encontrados: {count}")

        for i in range(min(count, 10)):
            post = posts.nth(i)

            title_locator = post.locator(".titleline a").first

            title = title_locator.inner_text()
            url = title_locator.get_attribute("href")

            print("Título:", title)
            print("URL:", url)

            send_post(title, url)

        browser.close()


if __name__ == "__main__":
    main()
