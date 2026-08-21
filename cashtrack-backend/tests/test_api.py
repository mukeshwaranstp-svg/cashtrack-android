"""
API contract tests — pin the JSON shapes the frontend (src/types.ts) depends on.

Every assertion here guards a real frontend read, e.g. result.streak,
result.milestoneReached, data.totalSpend, tx.goalId. If any of these breaks,
the React app breaks silently.
"""
import pytest
from fastapi.testclient import TestClient

EXPENSE_BODY = {
    "amount": 250.0,
    "category": "Coffee & Cafes",
    "note": "Cold brew",
    "date": "2026-08-05",
    "timestamp": "2026-08-05T12:00:00.000Z",
}


def _post_expense(client: TestClient, **overrides) -> dict:
    body = {**EXPENSE_BODY, **overrides}
    resp = client.post("/api/expense", json=body)
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_create_expense_returns_frontend_contract(client: TestClient):
    data = _post_expense(client)

    assert data["success"] is True
    assert set(data.keys()) == {"success", "expense", "streak", "milestoneReached", "milestoneValue"}

    exp = data["expense"]
    assert set(exp.keys()) == {
        "id", "amount", "category", "bucket", "note", "date", "timestamp",
        "reviewed", "justified", "goalId", "goalName", "goalImage", "allocations",
    }
    assert exp["amount"] == 250.0
    assert exp["category"] == "Coffee & Cafes"
    assert exp["bucket"] == "Wants"
    assert exp["date"] == "2026-08-05"
    assert exp["reviewed"] is False
    assert exp["justified"] is False

    assert data["streak"]["current_streak"] == 1
    assert data["streak"]["logged_today"] is True


def test_savings_expense_maps_to_savings_bucket(client: TestClient):
    data = _post_expense(client, category="Savings/Investment")
    assert data["expense"]["bucket"] == "Savings"


def test_goal_fields_round_trip(client: TestClient):
    data = _post_expense(
        client,
        category="Savings/Investment",
        goalId="goal_1",
        goalName="New Laptop",
        goalImage="💻",
        allocations={"goal_1": 500.0},
    )
    exp = data["expense"]
    assert exp["goalId"] == "goal_1"
    assert exp["goalName"] == "New Laptop"
    assert exp["goalImage"] == "💻"
    assert exp["allocations"] == {"goal_1": 500.0}


def test_create_expense_advances_streak_and_milestone(client: TestClient):
    r1 = _post_expense(client, date="2026-08-05")
    r2 = _post_expense(client, date="2026-08-06")
    r3 = _post_expense(client, date="2026-08-07")
    assert [r1["streak"]["current_streak"], r2["streak"]["current_streak"], r3["streak"]["current_streak"]] == [1, 2, 3]
    assert r3["milestoneReached"] is True
    assert r3["milestoneValue"] == 3
    assert r1["milestoneReached"] is False


def test_invalid_amount_rejected(client: TestClient):
    resp = client.post("/api/expense", json={**EXPENSE_BODY, "amount": -5})
    assert resp.status_code == 422


def test_unknown_category_rejected(client: TestClient):
    resp = client.post("/api/expense", json={**EXPENSE_BODY, "category": "Not a real category"})
    assert resp.status_code == 422


def test_list_expenses_newest_first(client: TestClient):
    _post_expense(client, date="2026-08-01", timestamp="2026-08-01T12:00:00.000Z", note="first")
    _post_expense(client, date="2026-08-03", timestamp="2026-08-03T12:00:00.000Z", note="second")
    expenses = client.get("/api/expenses").json()
    assert len(expenses) == 2
    assert expenses[0]["note"] == "second"  # ordered by timestamp desc


def test_update_expense(client: TestClient):
    created = _post_expense(client)
    expense_id = created["expense"]["id"]

    resp = client.put(
        f"/api/expense/{expense_id}",
        json={"amount": 999.0, "category": "Food", "note": "edited"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["expense"]["amount"] == 999.0
    assert data["expense"]["category"] == "Food"
    assert data["expense"]["bucket"] == "Needs"  # bucket recomputed from category


def test_patch_review_flags(client: TestClient):
    created = _post_expense(client)
    expense_id = created["expense"]["id"]

    resp = client.patch(f"/api/expense/{expense_id}", json={"reviewed": True, "justified": True})
    assert resp.status_code == 200
    assert resp.json()["expense"]["reviewed"] is True
    assert resp.json()["expense"]["justified"] is True


def test_delete_expense(client: TestClient):
    created = _post_expense(client)
    expense_id = created["expense"]["id"]

    resp = client.delete(f"/api/expense/{expense_id}")
    assert resp.status_code == 200
    assert resp.json() == {"success": True}
    assert client.get("/api/expenses").json() == []


def test_delete_missing_expense_404(client: TestClient):
    resp = client.delete("/api/expense/nonexistent")
    assert resp.status_code == 404


def test_streak_endpoint(client: TestClient):
    resp = client.get("/api/streak")
    assert resp.status_code == 200
    body = resp.json()
    assert set(body.keys()) == {"current_streak", "longest_streak", "last_logged_date", "logged_today"}


def test_streak_reset(client: TestClient):
    _post_expense(client, date="2026-08-05")
    resp = client.post("/api/streak/reset")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["streak"]["current_streak"] == 0


def test_summary_returns_full_frontend_payload(client: TestClient):
    _post_expense(client, date="2026-08-05", amount=1000.0, category="Food")
    _post_expense(client, date="2026-08-06", amount=500.0, category="Entertainment")
    _post_expense(client, date="2026-08-06", amount=250.0, category="Savings/Investment")
    _post_expense(client, date="2026-07-20", amount=3000.0, category="Rent")

    resp = client.get("/api/summary", params={"today": "2026-08-06"})
    assert resp.status_code == 200
    data = resp.json()

    assert set(data.keys()) == {
        "totalSpend", "monthlyBudget", "dailyThreshold", "bucketSummary",
        "categorySummary", "heatmap", "weeklyTrend", "recentTransactions",
        "lastMonthSpend", "streak",
    }
    assert data["totalSpend"] == 1750.0
    assert data["lastMonthSpend"] == 3000.0

    buckets = {b["bucket"]: b for b in data["bucketSummary"]}
    assert buckets["Needs"]["amount"] == 1000.0
    assert buckets["Wants"]["amount"] == 500.0
    assert buckets["Savings"]["amount"] == 250.0
    assert buckets["Needs"]["targetPercentage"] == 70.0
    assert buckets["Wants"]["targetPercentage"] == 20.0
    assert buckets["Savings"]["targetPercentage"] == 10.0

    # all 17 categories present in render order
    cats = [c["category"] for c in data["categorySummary"]]
    assert len(cats) == 17
    assert cats[0] == "Food"
    assert cats[-1] == "Savings/Investment"

    # heatmap only covers days with activity, daily threshold uses real Aug (31)
    assert len(data["heatmap"]) == 2
    assert data["dailyThreshold"] == pytest.approx(15000 / 31)
    assert data["heatmap"][0]["date"] == "2026-08-05"
    assert data["heatmap"][0]["isOverBudget"] is True  # 1000 > 483 threshold

    # weekly trend covers 7 days ending on today, with per-bucket split
    assert len(data["weeklyTrend"]) == 7
    assert data["weeklyTrend"][-1]["date"] == "2026-08-06"
    assert data["weeklyTrend"][-1]["amount"] == 750.0
    assert data["weeklyTrend"][-1]["needs"] == 0.0
    assert data["weeklyTrend"][-1]["wants"] == 500.0
    assert data["weeklyTrend"][-1]["savings"] == 250.0
    assert data["weeklyTrend"][-2]["needs"] == 1000.0
    assert data["weeklyTrend"][-2]["wants"] == 0.0
    assert data["weeklyTrend"][-2]["savings"] == 0.0

    assert len(data["recentTransactions"]) == 4
    assert data["streak"]["current_streak"] == 2
    assert data["streak"]["logged_today"] is True


def test_summary_last_month_spend_ignores_this_month(client: TestClient):
    _post_expense(client, date="2026-08-05", amount=1000.0, category="Food")
    _post_expense(client, date="2026-07-20", amount=500.0, category="Rent")

    resp = client.get("/api/summary", params={"today": "2026-08-06"})
    data = resp.json()
    assert data["totalSpend"] == 1000.0
    assert data["lastMonthSpend"] == 500.0


def test_summary_empty_state(client: TestClient):
    resp = client.get("/api/summary", params={"today": "2026-08-06"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["totalSpend"] == 0
    assert len(data["categorySummary"]) == 17
    assert all(c["amount"] == 0 for c in data["categorySummary"])
    assert data["streak"]["current_streak"] == 0


def test_settings_update(client: TestClient):
    resp = client.post("/api/settings", json={"monthly_budget": 20000})
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["settings"]["monthlyBudget"] == 20000.0

    # summary reflects the new budget
    summary = client.get("/api/summary", params={"today": "2026-08-06"}).json()
    assert summary["monthlyBudget"] == 20000.0
