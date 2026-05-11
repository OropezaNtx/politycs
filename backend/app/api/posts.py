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
