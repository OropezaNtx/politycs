from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.schemas import PostCreate, PostResponse
from app.services import post_service


router = APIRouter(
    prefix="/posts",
    tags=["Posts"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=PostResponse)
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    created_post = post_service.create_post(db, post)

    if created_post is None:
        raise HTTPException(
            status_code=409,
            detail="Post already exists"
        )

    return created_post


@router.get("/", response_model=list[PostResponse])
def get_posts(
    platform: str | None = None,
    source: str | None = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    return post_service.get_posts(
        db=db,
        platform=platform,
        source=source,
        limit=limit
    )

@router.get("/recent")
def get_recent_posts(
    source: str = "all",
    limit: int = 15,
    db: Session = Depends(get_db)
):
    query = db.query(post_service.Post)

    if source and source != "all":
        query = query.filter(post_service.Post.source == source)

    posts = (
        query
        .order_by(post_service.Post.id.desc())
        .limit(limit)
        .all()
    )

    return {
        "source": source,
        "total_returned": len(posts),
        "posts": [
            {
                "id": post.id,
                "title": post.title,
                "source": post.source,
                "platform": post.platform,
                "sentiment": post.sentiment,
                "topics": post.topics,
                "political_score": post.political_score,
                "toxicity_score": post.toxicity_score,
                "url": post.url,
                "scraped_at": post.scraped_at,
            }
            for post in posts
        ]
    }