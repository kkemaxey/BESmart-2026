# Backend: FastAPI

## Layout

```
app/
  main.py            # FastAPI app, CORS, router mounting
  core/config.py     # Settings (env vars / .env via pydantic-settings)
  db/base.py         # SQLAlchemy declarative Base
  db/session.py      # Async engine, session factory, get_db dependency
  api/deps.py        # Shared dependencies (SessionDep)
  api/router.py      # Mounts all route modules under /api/v1
  api/routes/        # One module per resource
  models/            # SQLAlchemy models (import each one in models/__init__.py)
  schemas/           # Pydantic request/response models
alembic/             # Migrations (async env.py, reads DATABASE_URL from settings)
tests/               # pytest (uses in-memory SQLite, no MySQL needed)
```

## Local development

```bash
cp .env.example .env
docker compose up -d                      # MySQL 8.4 on localhost:3306
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
alembic upgrade head
fastapi dev app/main.py                   # http://localhost:8000/docs
```

## Migrations (Alembic)

1. Add a model in `app/models/` and import it in `app/models/__init__.py`.
2. Generate a migration: `alembic revision --autogenerate -m "add users table"`
3. Review the generated file in `alembic/versions/`.
4. Apply it: `alembic upgrade head` (roll back one step with `alembic downgrade -1`).

## Lint, format, test

```bash
ruff check .            # lint (add --fix to auto-fix)
ruff format .           # format
pytest                  # tests
```

## Dependencies

- `requirements.txt`: runtime dependencies (installed in the Docker image)
- `requirements-dev.txt`: runtime plus test and lint tools

If `pip install` fails while building `cryptography` (seen on older macOS versions), use `pip install --prefer-binary -r requirements-dev.txt`.

## Deploying to Cloud Run

```bash
gcloud run deploy besmart-api \
  --source . \
  --region us-central1 \
  --set-env-vars ENVIRONMENT=production,CORS_ORIGINS=https://your-app.vercel.app \
  --set-secrets DATABASE_URL=besmart-database-url:latest \
  --add-cloudsql-instances PROJECT:REGION:INSTANCE
```

- `--source .` builds the `Dockerfile` with Cloud Build. You can also build and push to Artifact Registry yourself and deploy with `--image`.
- For Cloud SQL (MySQL), store `DATABASE_URL` in Secret Manager using the unix socket form:
  `mysql+asyncmy://USER:PASS@/DB_NAME?unix_socket=/cloudsql/PROJECT:REGION:INSTANCE`
- Run migrations against production before (or as part of) a deploy, for example with a Cloud Run Job that runs `alembic upgrade head` using the same image.
