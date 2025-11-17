"""Utility to create all database tables."""
from __future__ import annotations

from app.db.database import Base, engine
from app.db import models  # noqa: F401 - ensure model metadata is registered


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database tables created.")
