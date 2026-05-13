from fastapi import FastAPI

from app.database import Base, engine
from app.api.posts import router as posts_router
from app.api.nlp import router as nlp_router
from app.api.analytics import router as analytics_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware
from app.api.rss import router as rss_router

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Politycs API",
    description="Backend inicial para la plataforma Politycs",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Politycs API funcionando correctamente"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }


app.include_router(posts_router)
app.include_router(nlp_router)
app.include_router(analytics_router)
app.include_router(rss_router)
