"""
The 17 categories the frontend actually sends, and their bucket mapping.

This mirrors src/constants/categories.ts in the frontend exactly — same names,
same 70/20/10 buckets. Keeping category->bucket honest is the whole point of
the 70/20/10 analysis: if "Coffee & Cafes" (a Want) could silently become a
Need, the comparison becomes noise.
"""
from enum import Enum


class Bucket(str, Enum):
    NEEDS = "Needs"
    WANTS = "Wants"
    SAVINGS = "Savings"


class Category(str, Enum):
    FOOD = "Food"
    RENT = "Rent"
    TRANSPORT = "Transport"
    BILLS = "Bills"
    EDUCATION = "Education"
    MEDICAL = "Medical"
    UTILITIES = "Utilities"
    MOBILE_INTERNET = "Mobile & Internet"
    ENTERTAINMENT = "Entertainment"
    SHOPPING = "Shopping"
    COFFEE_CAFES = "Coffee & Cafes"
    DINING_OUT = "Dining Out"
    GAMING = "Gaming"
    GIFTS = "Gifts"
    TRAVEL = "Travel"
    FUN = "Fun"
    SAVINGS_INVESTMENT = "Savings/Investment"


CATEGORY_TO_BUCKET: dict[Category, Bucket] = {
    Category.FOOD: Bucket.NEEDS,
    Category.RENT: Bucket.NEEDS,
    Category.TRANSPORT: Bucket.NEEDS,
    Category.BILLS: Bucket.NEEDS,
    Category.EDUCATION: Bucket.NEEDS,
    Category.MEDICAL: Bucket.NEEDS,
    Category.UTILITIES: Bucket.NEEDS,
    Category.MOBILE_INTERNET: Bucket.NEEDS,
    Category.ENTERTAINMENT: Bucket.WANTS,
    Category.SHOPPING: Bucket.WANTS,
    Category.COFFEE_CAFES: Bucket.WANTS,
    Category.DINING_OUT: Bucket.WANTS,
    Category.GAMING: Bucket.WANTS,
    Category.GIFTS: Bucket.WANTS,
    Category.TRAVEL: Bucket.WANTS,
    Category.FUN: Bucket.WANTS,
    Category.SAVINGS_INVESTMENT: Bucket.SAVINGS,
}

# 70/20/10 targets — used by the summary endpoint's budget math.
BUCKET_TARGETS: dict[Bucket, float] = {
    Bucket.NEEDS: 0.70,
    Bucket.WANTS: 0.20,
    Bucket.SAVINGS: 0.10,
}

# The order the frontend renders categories in the analysis screen.
CATEGORY_ORDER: list[Category] = [
    Category.FOOD,
    Category.RENT,
    Category.TRANSPORT,
    Category.BILLS,
    Category.EDUCATION,
    Category.MEDICAL,
    Category.UTILITIES,
    Category.MOBILE_INTERNET,
    Category.ENTERTAINMENT,
    Category.SHOPPING,
    Category.COFFEE_CAFES,
    Category.DINING_OUT,
    Category.GAMING,
    Category.GIFTS,
    Category.TRAVEL,
    Category.FUN,
    Category.SAVINGS_INVESTMENT,
]


def get_bucket_for_category(category: Category) -> Bucket:
    """Look up the bucket for a category. Raises if it isn't one of the 17."""
    return CATEGORY_TO_BUCKET[category]
