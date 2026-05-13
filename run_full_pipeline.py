import subprocess
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
PLAYWRIGHT_DIR = ROOT_DIR / "scraping" / "playwright-test"


def run_command(command, cwd=None):
    print(f"\nEjecutando: {' '.join(command)}")

    result = subprocess.run(
        command,
        cwd=cwd,
        text=True
    )

    if result.returncode != 0:
        raise RuntimeError(f"Error ejecutando: {' '.join(command)}")

    return result


def main():
    print("Iniciando Politycs Full Pipeline")

    # Ejecutar scraper Dockerizado
    run_command(
        ["docker", "compose", "up", "--build"],
        cwd=PLAYWRIGHT_DIR
    )

    # Ejecutar NLP pipeline
    run_command(
        [
            str(ROOT_DIR / "venv" / "bin" / "python"),
            "-m",
            "app.jobs.run_nlp_pipeline"
        ],
        cwd=BACKEND_DIR
    )

    print("\nPipeline terminado correctamente")
    print("Dashboard actualizado con datos nuevos")


if __name__ == "__main__":
    main()
