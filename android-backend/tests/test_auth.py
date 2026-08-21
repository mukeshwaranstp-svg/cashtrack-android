"""Auth flow tests: register, login, refresh, me, and failure modes."""
import pytest


def test_register_returns_tokens_and_user(client):
    resp = client.post("/api/auth/register", json={
        "email": "a@test.com", "password": "password123", "username": "a",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["accessToken"]
    assert data["refreshToken"]
    assert data["user"]["email"] == "a@test.com"


def test_register_duplicate_email_conflict(client):
    body = {"email": "dup@test.com", "password": "password123"}
    assert client.post("/api/auth/register", json=body).status_code == 201
    assert client.post("/api/auth/register", json=body).status_code == 409


def test_register_short_password_rejected(client):
    resp = client.post("/api/auth/register", json={
        "email": "short@test.com", "password": "abc",
    })
    assert resp.status_code == 422


def test_login_success_and_wrong_password(client):
    client.post("/api/auth/register", json={
        "email": "b@test.com", "password": "password123",
    })
    ok = client.post("/api/auth/login", json={
        "email": "b@test.com", "password": "password123",
    })
    assert ok.status_code == 200
    assert ok.json()["accessToken"]

    bad = client.post("/api/auth/login", json={
        "email": "b@test.com", "password": "wrongpass123",
    })
    assert bad.status_code == 401


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_valid_token(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"].endswith("@test.com")


def test_refresh_token_flow(client):
    reg = client.post("/api/auth/register", json={
        "email": "c@test.com", "password": "password123",
    }).json()
    refreshed = client.post("/api/auth/refresh", json={
        "refresh_token": reg["refreshToken"],
    })
    assert refreshed.status_code == 200
    new_access = refreshed.json()["accessToken"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {new_access}"})
    assert me.status_code == 200


def test_access_token_cannot_refresh(client, auth_headers):
    """Type confusion guard: an access token must not work as a refresh token."""
    access = auth_headers["Authorization"].split(" ", 1)[1]
    resp = client.post("/api/auth/refresh", json={"refresh_token": access})
    assert resp.status_code == 401


def test_garbage_token_rejected(client):
    resp = client.get("/api/auth/me", headers={"Authorization": "Bearer not.a.jwt"})
    assert resp.status_code == 401
