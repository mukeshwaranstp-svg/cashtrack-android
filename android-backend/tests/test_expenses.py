"""Expense + isolation tests: the core security property of a multi-user backend."""
from datetime import date


def _register(client, email):
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "password123",
    })
    data = resp.json()
    return {"Authorization": f"Bearer {data['accessToken']}"}


def test_create_expense_updates_streak(client, auth_headers):
    resp = client.post("/api/expense", headers=auth_headers, json={
        "amount": 250.0,
        "category": "Food",
        "note": "lunch",
        "date": str(date.today()),
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["expense"]["bucket"] == "Needs"
    assert data["streak"]["currentStreak"] == 1
    assert data["streak"]["loggedToday"] is True
    assert data["milestoneReached"] is False


def test_expenses_require_auth(client):
    assert client.get("/api/expenses").status_code == 401
    assert client.post("/api/expense", json={"amount": 10, "category": "Food"}).status_code == 401


def test_user_isolation_user_b_cannot_touch_user_a_expense(client):
    """User B must get 404 (not the data) for user A's expense id."""
    headers_a = _register(client, "owner@test.com")
    headers_b = _register(client, "attacker@test.com")

    created = client.post("/api/expense", headers=headers_a, json={
        "amount": 999.0, "category": "Shopping", "note": "private",
    }).json()["expense"]
    expense_id = created["id"]

    # B cannot read A's list...
    listed = client.get("/api/expenses", headers=headers_b).json()
    assert all(e["id"] != expense_id for e in listed)

    # ...read, edit, or delete A's row by id.
    assert client.get(f"/api/expense/{expense_id}", headers=headers_b).status_code in (404, 405)
    assert client.put(
        f"/api/expense/{expense_id}", headers=headers_b,
        json={"amount": 1.0},
    ).status_code == 404
    assert client.patch(
        f"/api/expense/{expense_id}", headers=headers_b,
        json={"reviewed": True},
    ).status_code == 404
    assert client.delete(f"/api/expense/{expense_id}", headers=headers_b).status_code == 404

    # A still sees it intact.
    mine = client.get("/api/expenses", headers=headers_a).json()
    assert any(e["id"] == expense_id and e["amount"] == 999.0 for e in mine)


def test_summary_scoped_per_user(client):
    headers_a = _register(client, "sumA@test.com")
    headers_b = _register(client, "sumB@test.com")

    client.post("/api/expense", headers=headers_a, json={
        "amount": 5000.0, "category": "Rent",
    })

    summary_a = client.get("/api/summary", headers=headers_a).json()
    summary_b = client.get("/api/summary", headers=headers_b).json()

    assert summary_a["totalSpend"] == 5000.0
    assert summary_b["totalSpend"] == 0.0


def test_sync_bundle_roundtrip(client, auth_headers):
    bundle = client.get("/api/sync", headers=auth_headers).json()
    assert bundle["profile"] is not None
    assert bundle["wallet"]["xp"] == 0

    bundle["settings"]["monthlyBudget"] = 25000.0
    bundle["todos"].append({
        "id": "todo123", "text": "Buy groceries", "completed": False, "category": "",
    })
    put = client.put("/api/sync", headers=auth_headers, json=bundle)
    assert put.status_code == 200

    again = client.get("/api/sync", headers=auth_headers).json()
    assert again["settings"]["monthlyBudget"] == 25000.0
    assert any(t["id"] == "todo123" for t in again["todos"])


def test_sync_cannot_leak_across_users(client):
    """Todos upserted by A must never appear in B's bundle even with matching ids."""
    headers_a = _register(client, "syncA@test.com")
    headers_b = _register(client, "syncB@test.com")

    bundle_a = client.get("/api/sync", headers=headers_a).json()
    bundle_a["todos"].append({
        "id": "shared-id", "text": "A's private todo", "completed": False, "category": "",
    })
    client.put("/api/sync", headers=headers_a, json=bundle_a)

    bundle_b = client.get("/api/sync", headers=headers_b).json()
    assert all(t["id"] != "shared-id" for t in bundle_b["todos"])
