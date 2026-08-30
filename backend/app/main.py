from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.api.posts import router as posts_router
from app.api.nlp import router as nlp_router
from app.api.analytics import router as analytics_router
from app.api.rss import router as rss_router
from app.api.geo import router as geo_router
from app.api.intelligence_v2 import router as intelligence_v2_router
from app.api.projects import router as projects_router
from app.services.scheduler_service import start_scheduler

# Importing the project router/model before create_all ensures the V2 table is registered.
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Politycs API",
    description="Public intelligence backend for Politycs",
    version="0.2.0"
)


@app.on_event("startup")
def startup_event():
    start_scheduler()


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
        "message": "Politycs API funcionando correctamente",
        "version": "0.2.0",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "version": "0.2.0",
    }


app.include_router(posts_router)
app.include_router(nlp_router)
app.include_router(analytics_router)
app.include_router(rss_router)
app.include_router(geo_router)
app.include_router(intelligence_v2_router)
app.include_router(projects_router)
