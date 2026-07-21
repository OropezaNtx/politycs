# Politycs

Plataforma de inteligencia política y territorial que recopila información pública, la enriquece con NLP y presenta señales accionables en un dashboard web.

## Estado del proyecto

Última actualización documental: 20 de julio de 2026.

La rama activa de desarrollo es `feature/api-integration`. Actualmente el sistema cuenta con:

- ingestión automática de noticias mediante RSS;
- normalización y deduplicación por URL y título;
- análisis NLP de sentimiento, temas, entidades, toxicidad y relevancia política;
- filtros por fuente en el dashboard;
- tendencias temporales y temas emergentes;
- inteligencia geográfica basada en menciones territoriales;
- análisis de narrativas, crisis y actividad por plataforma;
- feed de publicaciones recientes y métricas en vivo;
- scheduler de ingestión RSS cada 30 minutos.

## Arquitectura

```text
Fuentes RSS / colectores
        ↓
FastAPI + servicios de ingestión
        ↓
PostgreSQL
        ↓
NLP y endpoints analíticos
        ↓
Dashboard Next.js
```

## Tecnologías

- Backend: Python, FastAPI, SQLAlchemy y spaCy.
- Base de datos: PostgreSQL 16.
- Frontend: Next.js, React, Tailwind CSS y Recharts.
- Recolección: RSS, Feedparser y Playwright.
- Infraestructura local: Docker Compose.

## Arranque rápido

Consulta [README_DEV.md](README_DEV.md) para preparar el entorno y ejecutar todos los servicios.

Con el entorno ya instalado:

```bash
# Terminal 1: backend
cd backend
source ../venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: frontend
cd frontend-dashboard
npm run dev
```

- Dashboard: http://localhost:3000/dashboard
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs

## Estado funcional verificado

El 20 de julio de 2026 se verificó localmente el arranque del frontend y backend, la ingestión RSS y respuestas HTTP 200 en los endpoints de resumen, fuentes, geografía, plataformas, crisis, narrativas, temas emergentes y publicaciones recientes.
