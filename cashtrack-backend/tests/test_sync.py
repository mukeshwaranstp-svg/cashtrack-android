"""
Tests for the sync layer: GET/PUT/POST /api/sync bundle round-trip and the
resource CRUD endpoints (goals, savings-history, todos, profile, wallet,
companion). Response keys are asserted in camelCase exactly as the frontend
reads them.
"""
import json

from fastapi.testclient import TestClient

FULL_BUNDLE = {
    "profile": {
        "avatar": "🦁", "name": "Arigato Student", "username": "@arigato.stp",
        "email": "arigato.stp@gmail.com", "bio": "Sem 3 engineering student",
        "profilePic": None,
    },
    "wallet": {
        "xp": 350, "coins": 120, "totalXpEarned": 90, "totalCoinsEarned": 45,
        "freezeCount": 0, "completedMissionsCount": 3,
        "completedStreakDates": ["2026-08-04", "2026-08-05"],
        "unlockedAchievements": ["streak_3"],
    },
    "goals": [
        {
            "id": "goal_abc123", "name": "MacBook Pro", "target": 45000,
            "current": 18000, "image": "laptop", "deadline": "2026-12-31",
            "priority": 1, "notes": "Sem 4", "completed": False,
            "completionDate": None, "difficulty": "Epic", "status": "On Track",
        }
    ],
    "savingsHistory": [
        {
            "id": "tx_m1k2x3", "goalId": "goal_abc123", "goalName": "MacBook Pro",
            "amount": 500, "date": "2026-08-05", "type": "deposit",
            "notes": "Savings Pool Outlay deposit",
        }
    ],
    "todos": [{"id": "1712345", "text": "Set monthly budget", "completed": True, "category": "Budget"}],
    "companion": {
        "selected": "waguri", "visibility": "events", "customImage": None,
        "customName": None, "onboarded": True,
    },
    "settings": {
        "monthlyBudget": 20000, "currency": "$", "theme": "dark",
        "alertEnabled": True, "alertThreshold": 1500, "challengeDays": 10,
    },
    "streak": {
        "current_streak": 0, "longest_streak": 0, "last_logged_date": None,
        "logged_today": False,
    },
    "misc": {
        "lastExport": "10:15 AM on 8/5/2026",
        "lastBudgetUpdate": "₹18000 at 9:00 AM",
        "firstExpenseLogged": True,
        "streakStats": {
            "current_streak": 3, "longest_streak": 5, "last_logged_date": "2026-08-04",
            "freeze_count": 0, "completed_missions_count": 3,
            "total_xp_earned": 90, "total_coins_earned": 45,
        },
    },
}


def test_get_sync_returns_full_bundle(client: TestClient):
    resp = client.get("/api/sync")
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) == {
        "profile", "wallet", "goals", "savingsHistory", "todos",
        "companion", "settings", "streak", "misc",
    }
    assert data["profile"]["profilePic"] is None
    assert data["wallet"]["completedStreakDates"] == []
    assert data["settings"]["monthlyBudget"] == 15000.0
    assert data["goals"] == []
    assert data["streak"]["current_streak"] == 0


def test_put_sync_round_trips_full_bundle(client: TestClient):
    resp = client.put("/api/sync", json=FULL_BUNDLE)
    assert resp.status_code == 200
    data = resp.json()
    assert data["profile"]["name"] == "Arigato Student"
    assert data["wallet"]["xp"] == 350
    assert data["wallet"]["coins"] == 120
    assert data["wallet"]["totalXpEarned"] == 90
    assert data["wallet"]["completedStreakDates"] == ["2026-08-04", "2026-08-05"]
    assert data["wallet"]["unlockedAchievements"] == ["streak_3"]
    assert len(data["goals"]) == 1
    assert data["goals"][0]["target"] == 45000
    assert data["goals"][0]["completionDate"] is None
    assert data["goals"][0]["deadline"] == "2026-12-31"
    assert data["savingsHistory"][0]["goalId"] == "goal_abc123"
    assert data["todos"][0]["text"] == "Set monthly budget"
    assert data["companion"]["onboarded"] is True
    assert data["settings"]["monthlyBudget"] == 20000.0
    assert data["settings"]["currency"] == "$"
    assert data["settings"]["theme"] == "dark"
    assert data["settings"]["alertThreshold"] == 1500.0
    assert data["settings"]["challengeDays"] == 10
    assert data["misc"]["lastExport"] == "10:15 AM on 8/5/2026"
    assert data["misc"]["streakStats"]["current_streak"] == 3


def test_put_sync_replaces_collections(client: TestClient):
    client.put("/api/sync", json=FULL_BUNDLE)
    assert len(client.get("/api/goals").json()) == 1

    slim = dict(FULL_BUNDLE)
    slim["goals"] = []
    slim["todos"] = []
    slim["savingsHistory"] = []
    client.put("/api/sync", json=slim)
    assert client.get("/api/goals").json() == []
    assert client.get("/api/todos").json() == []
    assert client.get("/api/savings-history").json() == []


def test_post_sync_accepts_beacon_text_plain(client: TestClient):
    # navigator.sendBeacon always sends Content-Type: text/plain. The POST
    # alias must parse the JSON body anyway (it can't set a JSON header).
    resp = client.post(
        "/api/sync",
        content=json.dumps(FULL_BUNDLE),
        headers={"Content-Type": "text/plain;charset=UTF-8"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["wallet"]["coins"] == 120
    assert data["profile"]["name"] == "Arigato Student"
    assert data["settings"]["challengeDays"] == 10
    assert len(data["goals"]) == 1


def test_post_sync_rejects_garbage_body(client: TestClient):
    resp = client.post("/api/sync", content="not json", headers={"Content-Type": "text/plain"})
    assert resp.status_code == 400
    assert "Invalid sync bundle" in resp.json()["detail"]


def test_goals_crud(client: TestClient):
    created = client.post("/api/goals", json={
        "name": "Emergency Fund", "target": 50000, "current": 1000,
        "image": "🛟", "deadline": "2027-01-01", "priority": 1,
        "notes": "6 months runway", "difficulty": "Legendary",
    })
    assert created.status_code == 201
    goal = created.json()
    gid = goal["id"]
    assert goal["difficulty"] == "Legendary"
    assert goal["completed"] is False

    goals = client.get("/api/goals").json()
    assert len(goals) == 1 and goals[0]["id"] == gid

    updated = client.put(f"/api/goals/{gid}", json={"current": 6000, "completed": True})
    assert updated.status_code == 200
    body = updated.json()
    assert body["current"] == 6000.0
    assert body["completed"] is True
    assert body["completionDate"] is not None  # auto-set on completion

    assert client.delete(f"/api/goals/{gid}").json() == {"success": True}
    assert client.get("/api/goals").json() == []
    assert client.put("/api/goals/nope", json={"current": 1}).status_code == 404


def test_goals_filter_completed(client: TestClient):
    a = client.post("/api/goals", json={"name": "A", "target": 1000}).json()
    b = client.post("/api/goals", json={"name": "B", "target": 2000}).json()
    client.put(f"/api/goals/{b['id']}", json={"completed": True})
    assert len(client.get("/api/goals").json()) == 2
    assert len(client.get("/api/goals?completed=false").json()) == 1
    assert len(client.get("/api/goals?completed=true").json()) == 1
    assert a["id"] != b["id"]


def test_savings_history_crud(client: TestClient):
    resp = client.post("/api/savings-history", json={
        "goalId": "goal_x", "goalName": "Trip to Japan", "amount": 2500,
        "date": "2026-08-06", "type": "deposit", "notes": "monthly top-up",
    })
    assert resp.status_code == 201
    entry = resp.json()
    assert entry["goalId"] == "goal_x"
    assert entry["goalName"] == "Trip to Japan"
    assert entry["amount"] == 2500.0
    assert entry["type"] == "deposit"

    entries = client.get("/api/savings-history").json()
    assert len(entries) == 1 and entries[0]["id"] == entry["id"]


def test_todos_crud(client: TestClient):
    created = client.post("/api/todos", json={
        "text": "Review insurance", "category": "Bills",
    })
    assert created.status_code == 201
    todo = created.json()
    tid = todo["id"]
    assert todo["completed"] is False

    assert len(client.get("/api/todos").json()) == 1

    updated = client.put(f"/api/todos/{tid}", json={"completed": True})
    assert updated.json()["completed"] is True

    assert client.delete(f"/api/todos/{tid}").json() == {"success": True}
    assert client.get("/api/todos").json() == []
    assert client.put("/api/todos/zzz", json={"completed": True}).status_code == 404


def test_profile_get_put(client: TestClient):
    assert client.get("/api/profile").json()["name"] == ""
    resp = client.put("/api/profile", json={
        "avatar": "🐯", "name": "Mukesh", "username": "@mukesh", "email": "m@x.com",
        "bio": "learner", "profilePic": "data:image/png;base64,AAAA",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Mukesh"
    assert body["profilePic"] == "data:image/png;base64,AAAA"


def test_wallet_get_put(client: TestClient):
    assert client.get("/api/wallet").json()["xp"] == 0
    resp = client.put("/api/wallet", json={
        "xp": 500, "coins": 200, "totalXpEarned": 500, "totalCoinsEarned": 200,
        "freezeCount": 1, "completedMissionsCount": 4,
        "completedStreakDates": ["2026-08-04"], "unlockedAchievements": ["streak_3"],
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["xp"] == 500
    assert body["freezeCount"] == 1
    assert body["unlockedAchievements"] == ["streak_3"]


def test_companion_get_put(client: TestClient):
    assert client.get("/api/companion").json()["selected"] == "waguri"
    resp = client.put("/api/companion", json={
        "selected": "custom", "visibility": "events",
        "customImage": "data:image/png;base64,BBBB", "customName": "Buddy",
        "onboarded": True,
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["selected"] == "custom"
    assert body["customName"] == "Buddy"
    assert body["onboarded"] is True


def test_settings_accepts_new_preferences(client: TestClient):
    resp = client.post("/api/settings", json={
        "monthlyBudget": 18000, "currency": "₹", "theme": "dark",
        "alertEnabled": False, "alertThreshold": 2000, "challengeDays": 21,
    })
    assert resp.status_code == 200
    body = resp.json()["settings"]
    assert body["monthlyBudget"] == 18000.0
    assert body["currency"] == "₹"
    assert body["theme"] == "dark"
    assert body["alertEnabled"] is False
    assert body["alertThreshold"] == 2000.0
    assert body["challengeDays"] == 21

    summary = client.get("/api/summary", params={"today": "2026-08-06"}).json()
    assert summary["monthlyBudget"] == 18000.0
