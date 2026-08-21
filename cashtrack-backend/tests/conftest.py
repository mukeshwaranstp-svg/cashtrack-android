"""
Pytest setup.

A temp-file SQLite DB is wired up via DATABASE_URL BEFORE any app module is
imported, so tests never touch the real cashtrack.db. Each test gets a fresh,
isolated schema (create_all / drop_all).
"""
import os
import sys
import tempfile

# Must happen before `app.*` imports below.
_test_dir = tempfile.mkdtemp(prefix="cashtrack_tests_")
os.environ["DATABASE_URL"] = "sqlite:///" + os.path.join(_test_dir, "test.db")
os.environ["ENVIRONMENT"] = "test"

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine, SessionLocal
from app.main import app


@pytest.fixture()
def db():
    """Direct ORM session for unit tests (streak logic, summary math)."""
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    """HTTP client for API contract tests."""
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)
