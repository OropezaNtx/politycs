import subprocess
import time
from datetime import datetime
from pathlib import Path

import schedule


ROOT_DIR = Path(__file__).resolve().parent
PYTHON_BIN = ROOT_DIR / "venv" / "bin" / "python"
PIPELINE_FILE = ROOT_DIR / "run_full_pipeline.py"


def run_pipeline_job():
    print("\n======================================")
    print(f"Ejecutando pipeline: {datetime.now()}")
    print("======================================")

    try:
        result = subprocess.run(
            [str(PYTHON_BIN), str(PIPELINE_FILE)],
            cwd=ROOT_DIR,
            text=True
        )

        if result.returncode == 0:
            print("Pipeline ejecutado correctamente")
        else:
            print(f"Pipeline terminó con error: {result.returncode}")

    except Exception as error:
        print(f"Error ejecutando scheduler: {error}")


def main():
    print("Politycs Scheduler iniciado")
    print("El pipeline correrá cada 15 minutos")

    run_pipeline_job()

    schedule.every(15).minutes.do(run_pipeline_job)

    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    main()
