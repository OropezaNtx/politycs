from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.post import Post
from app.services.nlp_service import analyze_text


router = APIRouter(
    prefix="/nlp",
    tags=["NLP"]
)


class AnalyzeRequest(BaseModel):
    text: str


@router.post("/analyze")
def analyze(request: AnalyzeRequest):
    return analyze_text(request.text)


@router.post("/analyze-post/{post_id}")
def analyze_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    text_to_analyze = post.raw_content or post.title or ""

    result = analyze_text(text_to_analyze)

    post.detected_language = result["detected_language"]
    post.sentiment = result["sentiment"]
    post.keywords = result["keywords"]
    post.topics = result["topics"]
    post.entities = result["entities"]
    post.political_score = result["political_score"]
    post.toxicity_score = result["toxicity_score"]

    db.commit()
    db.refresh(post)

    return {
        "message": "Post analyzed successfully",
        "post_id": post.id,
        "title": post.title,
        "nlp": result
    }


@router.post("/analyze-all")
def analyze_all_posts(db: Session = Depends(get_db)):
    posts = db.query(Post).all()

    analyzed = 0

    for post in posts:

        text_to_analyze = post.raw_content or post.title or ""

        if not text_to_analyze.strip():
            print("EMPTY CONTENT")
            continue

        result = analyze_text(text_to_analyze)


        post.detected_language = result["detected_language"]
        post.sentiment = result["sentiment"]
        post.keywords = result["keywords"]
        post.topics = result["topics"]
        post.entities = result["entities"]
        post.political_score = result["political_score"]
        post.toxicity_score = result["toxicity_score"]

        analyzed += 1


    db.commit()


    return {
        "message": "Posts analyzed successfully",
        "total_analyzed": analyzed
    }
