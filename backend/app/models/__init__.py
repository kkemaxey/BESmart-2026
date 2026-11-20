"""SQLAlchemy models.

Import every model module here so `Base.metadata` knows about all tables.
Alembic's env.py imports this package for autogenerate.

Example:
    from app.models.user import User  # noqa: F401
"""

from app.db.base import Base

__all__ = ["Base"]
