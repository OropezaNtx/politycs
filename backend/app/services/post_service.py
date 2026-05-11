from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.post import Post
from app.schemas import PostCreate
from app.services.nlp_service import analyze_text


def create_post(db: Session, post: PostCreate) -> Post | None:

    existing_post = db.query(Post).filter(Post.url == post.url).first()

    if existing_post:
        return None

    text_to_analyze = post.raw_content or post.title or ""

    analysis = analyze_text(text_to_analyze)

    new_post = Post(
        source=post.source,
        platform=post.platform,
        title=post.title,
        url=post.url,
        raw_content=post.raw_content,

        sentiment=analysis["sentiment"],
        keywords=analysis["keywords"],
        topics=analysis["topics"],
        entities=analysis["entities"],
        detected_language=analysis["detected_language"],
        political_score=analysis["political_score"],
        toxicity_score=analysis["toxicity_score"],

        language=post.language,
        tags=post.tags
    )

    try:
        db.add(new_post)
        db.commit()
        db.refresh(new_post)

        return new_post

    except IntegrityError:
        db.rollback()
        return None


def get_posts(
    db: Session,
    platform: str | None = None,
    source: str | None = None,
    limit: int = 20
) -> list[Post]:

    query = db.query(Post)

    if platform:
        query = query.filter(Post.platform == platform)

    if source:
        query = query.filter(Post.source == source)

    return query.order_by(Post.id.desc()).limit(limit).all()