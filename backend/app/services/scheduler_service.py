from apscheduler.schedulers.background import BackgroundScheduler

from app.database import SessionLocal
from app.services.rss_service import ingest_all_rss


scheduler = BackgroundScheduler()


def scheduled_rss_ingestion():
    db = SessionLocal()

    try:
        print("===================================")
        print("Scheduled RSS ingestion started")
        print("===================================")

        result = ingest_all_rss(db)

        print("===================================")
        print("Scheduled RSS ingestion finished")
        print(result)
        print("===================================")

    except Exception as error:
        print("===================================")
        print(f"Scheduled RSS ingestion error: {error}")
        print("===================================")

    finally:
        db.close()


def start_scheduler():
    if scheduler.running:
        return

    scheduler.add_job(
        scheduled_rss_ingestion,
        "interval",
        minutes=30,
        id="rss_ingestion_job",
        replace_existing=True,
    )

    scheduler.start()

    print("===================================")
    print("Scheduler started: RSS every 30 minutes")
    print("===================================")