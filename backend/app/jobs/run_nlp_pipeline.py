from app.database import SessionLocal
from app.models.post import Post
from app.services.nlp_service import analyze_text


def run_nlp_pipeline():
    db = SessionLocal()

    total_posts = 0
    analyzed_posts = 0
    skipped_posts = 0

    try:
        posts = db.query(Post).all()
        total_posts = len(posts)

        for post in posts:
            text_to_analyze = post.raw_content or post.title or ""

            if not text_to_analyze.strip():
                skipped_posts += 1
                continue

            result = analyze_text(text_to_analyze)

            post.detected_language = result.get("detected_language")
            post.sentiment = result.get("sentiment")
            post.keywords = result.get("keywords")
            post.topics = result.get("topics")
            post.entities = result.get("entities")
            post.political_score = result.get("political_score")
            post.toxicity_score = result.get("toxicity_score")

            analyzed_posts += 1

        db.commit()

        return {
            "status": "success",
            "total_posts": total_posts,
            "analyzed_posts": analyzed_posts,
            "skipped_posts": skipped_posts,
        }

    except Exception as error:
        db.rollback()
        return {
            "status": "error",
            "message": str(error),
            "total_posts": total_posts,
            "analyzed_posts": analyzed_posts,
            "skipped_posts": skipped_posts,
        }

    finally:
        db.close()


if __name__ == "__main__":
    result = run_nlp_pipeline()
    print(result)
