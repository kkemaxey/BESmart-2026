from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text

from app.api.deps import SessionDep

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    """Liveness check. Doesn't touch the database."""
    return {"status": "ok"}


@router.get("/health/db")
async def health_db(db: SessionDep) -> dict[str, str]:
    """Readiness check. Confirms the database is reachable."""
    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable"
        ) from exc
    return {"status": "ok", "database": "ok"}
