import requests

API_URL = "http://127.0.0.1:8000/posts/"


sample_posts = [
    {
        "platform": "twitter",
        "author_name": "usuario_demo",
        "content": "Primer post enviado automáticamente",
        "post_url": "https://x.com/demo/1"
    },
    {
        "platform": "facebook",
        "author_name": "pagina_demo",
        "content": "Segundo post automático",
        "post_url": "https://facebook.com/demo/2"
    }
]


for post in sample_posts:

    response = requests.post(
        API_URL,
        json=post
    )

    print(response.status_code)
    print(response.json())