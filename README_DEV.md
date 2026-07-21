# Politycs — guía de desarrollo

## Requisitos

- Ubuntu o entorno Linux equivalente.
- Python y un entorno virtual llamado `venv`.
- Node.js y npm.
- Docker y Docker Compose.
- PostgreSQL 16 disponible según la configuración de `.env`.

## Estructura principal

```text
politycs/
├── backend/
│   └── app/
│       ├── api/          # Endpoints REST y analíticos
│       ├── config/       # Fuentes RSS
│       ├── jobs/         # Ejecución de pipelines
│       ├── models/       # Modelos SQLAlchemy
│       └── services/     # RSS, NLP, geografía y scheduler
├── frontend-dashboard/
│   └── src/
│       ├── app/          # Rutas Next.js
│       ├── components/   # Paneles y visualizaciones
│       ├── context/      # Filtro global por fuente
│       └── services/     # Cliente de la API
├── scraping/             # Colectores y pruebas
├── docker-compose.yml
├── run_full_pipeline.py
└── scheduler.py
```

## Configuración inicial

Desde la raíz del repositorio:

```bash
cp .env.example .env
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cd frontend-dashboard
npm install
```

Revisa los valores de `.env` y `frontend-dashboard/.env.local`. Estos archivos son locales y no deben confirmarse en Git.

## Ejecución

### Backend

El backend debe iniciarse desde el directorio `backend`, porque utiliza importaciones con el paquete `app`:

```bash
cd /ruta/al/proyecto/politycs/backend
source ../venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Al iniciar la aplicación también se activa el scheduler RSS con intervalo de 30 minutos.

### Frontend

En otra terminal:

```bash
cd /ruta/al/proyecto/politycs/frontend-dashboard
npm run dev
```

Abre http://localhost:3000/dashboard. El cliente debe apuntar a la API en el puerto 8000.

## Funciones analíticas disponibles

- Resumen general y métricas por fuente.
- Sentimiento, temas y tendencias temporales.
- Ranking de contenido político.
- Distribución por fuente y plataforma.
- Menciones geográficas y zonas detectadas.
- Señales de crisis y alertas de inteligencia.
- Agrupación de narrativas dominantes.
- Temas emergentes: compara los 50 posts más recientes con el historial disponible y ordena por crecimiento relativo.
- Publicaciones recientes para el feed en vivo.

## Flujo de ingestión

1. Las fuentes se definen en `backend/app/config/rss_feeds.py`.
2. El servicio RSS consulta y normaliza cada entrada.
3. `post_service.py` evita duplicados por URL y por título.
4. El contenido o título se procesa mediante el servicio NLP.
5. Los resultados se almacenan en PostgreSQL.
6. El dashboard consulta los endpoints analíticos y se actualiza al recibir el evento `rss-updated`.

## Comprobaciones antes de confirmar cambios

```bash
git status
git diff --cached --check

cd frontend-dashboard
npm run lint

cd ../backend
source ../venv/bin/activate
python -m compileall app
```

Después inicia backend y frontend y verifica:

- http://localhost:8000/docs
- http://localhost:3000/dashboard

## Notas de desarrollo

- No ejecutes Uvicorn como `backend.app.main:app`; desde `backend` utiliza `app.main:app`.
- No confirmes `.env`, `.env.local`, bases locales, `node_modules`, `.next` ni `venv`.
- La detección actual de temas emergentes es una heurística por cantidad de publicaciones, no una comparación por ventana de tiempo.
- Los paneles deben manejar respuestas vacías sin romper la interfaz.

## Última validación conocida

El 20 de julio de 2026 se confirmó:

- compilación y navegación del dashboard con Next.js 16.2.6;
- arranque completo de FastAPI;
- scheduler RSS activo;
- ingestión exitosa desde BBC Mundo y Google News;
- respuestas HTTP 200 en resumen, fuentes, geografía, plataformas, crisis, narrativas, temas emergentes y posts recientes.
