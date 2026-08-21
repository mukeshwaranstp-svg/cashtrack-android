"""
Database connection setup (Android backend).

Same pattern as the web backend: SQLite for local dev, Postgres for deploy —
switching only requires changing DATABASE_URL. The critical difference vs the
web backend is what the schema looks like: every table carries a user_id FK so
each Android install's data is isolated behind its account.
"""
import os
import socket
import urllib.parse

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import get_settings

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL") or get_settings().database_url

# Providers hand out "postgresql://..." URIs without a driver; pin psycopg2.
if DATABASE_URL.startswith(("postgresql://", "postgres://")):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg2://", 1
    ).replace("postgres://", "postgresql+psycopg2://", 1)

    if "sslmode" not in DATABASE_URL:
        sep = "&" if "?" in DATABASE_URL else "?"
        DATABASE_URL += f"{sep}sslmode=require"

    # Supabase direct hosts can be IPv6-only while many hosts have no IPv6 route.
    parsed = urllib.parse.urlparse(DATABASE_URL)
    host = parsed.hostname
    if host and host.endswith((".supabase.co", ".supabase.com")):
        try:
            ipv4 = socket.getaddrinfo(host, None, socket.AF_INET)[0][4][0]
            DATABASE_URL = urllib.parse.urlunparse(
                parsed._replace(netloc=parsed.netloc.replace(host, ipv4))
            )
        except OSError:
            pass

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
