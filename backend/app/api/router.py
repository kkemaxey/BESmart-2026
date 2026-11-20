from fastapi import APIRouter

from app.api.routes import health

api_router = APIRouter()
api_router.include_router(health.router)
# Add new route modules here, e.g.:
# api_router.include_router(users.router, prefix="/users", tags=["users"])
