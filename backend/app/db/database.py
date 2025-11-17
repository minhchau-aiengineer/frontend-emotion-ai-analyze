"""Database engine and session management for SQL Server."""
from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.sqlserver_uri(),
    echo=settings.DEBUG,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def db_session() -> Generator[Session, None, None]:
    """Context manager for background jobs outside of request cycle."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:  # pragma: no cover
        db.rollback()
        logger.exception("Database session rollback due to error")
        raise
    finally:
        db.close()
