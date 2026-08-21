"""
Central, env-driven configuration.

An Android app talks to this server over the public internet, so secrets can't
be hardcoded: SECRET_KEY signs every JWT — anyone holding it can forge logins.
pydantic-settings reads .env / environment once at startup and fails loudly if
SECRET_KEY is still the placeholder in a non-debug deploy.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Signs and verifies JWTs. MUST be a long random string in production.
    secret_key: str = "dev-only-secret-change-me"
    algorithm: str = "HS256"

    # Short-lived access token + long-lived refresh token is the standard
    # mobile pattern: a stolen access token expires fast, while the refresh
    # token keeps the app logged in without re-prompting for a password.
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    database_url: str = "sqlite:///./cashtrack_android.db"

    # Set SECRET_KEY_STRICT=1 in prod to refuse booting with the dev secret.
    secret_key_strict: bool = False

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if settings.secret_key_strict and settings.secret_key == "dev-only-secret-change-me":
        raise RuntimeError("SECRET_KEY is still the dev default — set a real one")
    return settings
