"""
Summary aggregation — the 70/20/10 analysis behind /api/summary.

Port of server.ts's /api/summary handler, with two deliberate fixes:
  1. Daily heatmap threshold uses the real days-in-month (Feb vs 31-day
     months were subtly wrong with a hardcoded 30).
  2. Category breakdown iterates the real 17 frontend categories instead of a
     stale hardcoded list that could never match logged expense names.

Returns snake_case dicts; main.py wraps them in SummaryOut which emits camelCase.
"""
import calendar
from datetime import date, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import Expense, Settings
from app.categories import Bucket, BUCKET_TARGETS, CATEGORY_ORDER, CATEGORY_TO_BUCKET

DEFAULT_BUDGET = 15000.0
WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]


def get_or_create_settings(db: Session) -> Settings:
    settings = db.get(Settings, 1)
    if settings is None:
        settings = Settings(id=1, monthly_budget=DEFAULT_BUDGET)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def build_summary(db: Session, today: date) -> dict:
    settings = get_or_create_settings(db)
    budget = settings.monthly_budget

    year_month = today.strftime("%Y-%m")
    all_expenses = db.execute(select(Expense)).scalars().all()
    month_expenses = [e for e in all_expenses if e.date.strftime("%Y-%m") == year_month]

    total_spend = sum(e.amount for e in month_expenses)

    # ---- 70/20/10 bucket breakdown ----
    bucket_totals = {b: 0.0 for b in Bucket}
    for e in month_expenses:
        bucket_totals[Bucket(e.bucket)] += e.amount

    bucket_summary = []
    for bucket, target_pct in BUCKET_TARGETS.items():
        amount = bucket_totals[bucket]
        target_amount = budget * target_pct
        bucket_summary.append({
            "bucket": bucket.value,
            "amount": amount,
            "target_percentage": target_pct * 100,
            "relative_percentage": (amount / total_spend * 100) if total_spend > 0 else 0,
            "limit_percentage": (amount / target_amount * 100) if target_amount > 0 else 0,
            "is_over_budget": amount > target_amount,
            "target_amount": target_amount,
        })

    # ---- per-category breakdown (all 17, in frontend render order) ----
    category_totals: dict[str, float] = {}
    for e in month_expenses:
        category_totals[e.category] = category_totals.get(e.category, 0.0) + e.amount

    category_summary = []
    for category in CATEGORY_ORDER:
        amount = category_totals.get(category.value, 0.0)
        category_summary.append({
            "category": category.value,
            "amount": amount,
            "bucket": CATEGORY_TO_BUCKET[category].value,
            "percentage": (amount / total_spend * 100) if total_spend > 0 else 0,
        })

    # ---- heatmap: real days-in-month threshold, grouped by date ----
    days_in_month = calendar.monthrange(today.year, today.month)[1]
    daily_threshold = budget / days_in_month

    date_totals: dict[date, float] = {}
    for e in month_expenses:
        date_totals[e.date] = date_totals.get(e.date, 0.0) + e.amount

    heatmap = [
        {"date": d, "amount": amt, "is_over_budget": amt > daily_threshold}
        for d, amt in sorted(date_totals.items())
    ]

    # ---- weekly trend: last 7 days ending today, split by 70/20/10 bucket ----
    weekly_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_expenses = [e for e in all_expenses if e.date == day]
        day_needs = sum(e.amount for e in day_expenses if e.bucket == "Needs")
        day_wants = sum(e.amount for e in day_expenses if e.bucket == "Wants")
        day_savings = sum(e.amount for e in day_expenses if e.bucket == "Savings")
        weekly_trend.append({
            "date": day,
            "amount": day_needs + day_wants + day_savings,
            "label": WEEKDAYS[day.weekday()],
            "needs": day_needs,
            "wants": day_wants,
            "savings": day_savings,
        })

    # ---- last month's total spend (for month-over-month comparison) ----
    first_this_month = today.replace(day=1)
    last_month_start = (first_this_month - timedelta(days=1)).replace(day=1)
    last_month_end = first_this_month - timedelta(days=1)
    last_month_spend = sum(
        e.amount for e in all_expenses if last_month_start <= e.date <= last_month_end
    )

    # ---- recent transactions: newest 15 by timestamp ----
    recent_transactions = sorted(all_expenses, key=lambda e: e.timestamp, reverse=True)[:15]

    return {
        "total_spend": total_spend,
        "monthly_budget": budget,
        "daily_threshold": daily_threshold,
        "bucket_summary": bucket_summary,
        "category_summary": category_summary,
        "heatmap": heatmap,
        "weekly_trend": weekly_trend,
        "recent_transactions": recent_transactions,
        "last_month_spend": last_month_spend,
    }
