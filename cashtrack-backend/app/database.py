"""
Database connection setup.

Uses SQLite for local dev. Swapping to Postgres for Render deploy later
only requires changing DATABASE_URL — no other code changes needed,
since SQLAlchemy abstracts the dialect.
"""
import os
import socket
import urllib.parse

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Load DATABASE_URL from a .env file if one exists (optional convenience).
load_dotenv()

# Local dev default: SQLite file in project root.
# On Supabase/Render, set DATABASE_URL to the Postgres connection string:
#   postgresql://postgres:[password]@[host]:5432/postgres
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cashtrack.db")

# Supabase/other providers hand out "postgresql://..." URIs without a driver.
# Pin psycopg2 so SQLAlchemy doesn't have to guess which driver to use.
if DATABASE_URL.startswith(("postgresql://", "postgres://")):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg2://", 1
    ).replace("postgres://", "postgresql+psycopg2://", 1)

    # Supabase requires TLS on every connection.
    if "sslmode" not in DATABASE_URL:
        sep = "&" if "?" in DATABASE_URL else "?"
        DATABASE_URL += f"{sep}sslmode=require"

    # Supabase's direct host can be IPv6-only, and Render's free tier has no
    # IPv6 route ("Network is unreachable"). Pin the first IPv4 address of any
    # Supabase host (direct or pooler) so connections always go over IPv4.
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

# check_same_thread=False is only needed for SQLite (FastAPI uses multiple threads).
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class all ORM models inherit from."""
    pass


def get_db():
    """FastAPI dependency — yields a session, guarantees it closes after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
