"""
UdyamSaarthi-AI
Phase 7 — Business Economics

Transparent business-category planning assumptions.

IMPORTANT
---------
These are NOT:
- government statistics
- government scheme rules
- guaranteed market prices
- guaranteed business outcomes

They are deterministic planning assumptions used when
location-specific business economics are not sufficiently available.

The viability engine combines these assumptions with:
- local consumer base
- purchasing power
- category-specific competition
- local resources
- market access
- available evidence
"""

from typing import Any, Dict


BUSINESS_ECONOMICS: Dict[str, Dict[str, Any]] = {

    "Dairy": {
        "demand_signal": 0.80,
        "resource_relevance": 0.90,
        "market_access": 0.65,
        "monthly_revenue_factor": 0.80,
        "operating_cost_ratio": 0.72,
        "seasonality_risk": 0.35,
        "supply_chain_risk": 0.30,
        "capital_intensity": 0.75,

        "resource_dependency": "livestock",
        "market_dependency": "local",

        "strengths": [
            "Recurring local demand",
            "Can benefit from livestock availability",
            "Potential for multiple revenue streams",
        ],

        "risks": [
            "Feed and input-cost volatility",
            "Animal health risk",
            "Milk-price fluctuations",
        ],
    },

    "Kirana": {
        "demand_signal": 0.85,
        "resource_relevance": 0.45,
        "market_access": 0.80,
        "monthly_revenue_factor": 0.90,
        "operating_cost_ratio": 0.88,
        "seasonality_risk": 0.20,
        "supply_chain_risk": 0.25,
        "capital_intensity": 0.55,

        "resource_dependency": "distribution",
        "market_dependency": "local",

        "strengths": [
            "Frequent repeat purchases",
            "Broad product demand",
            "Potential for home delivery",
        ],

        "risks": [
            "Thin margins",
            "Inventory lock-up",
            "Strong competition in established markets",
        ],
    },

    "Tailoring": {
        "demand_signal": 0.65,
        "resource_relevance": 0.35,
        "market_access": 0.60,
        "monthly_revenue_factor": 0.65,
        "operating_cost_ratio": 0.55,
        "seasonality_risk": 0.40,
        "supply_chain_risk": 0.15,
        "capital_intensity": 0.35,

        "resource_dependency": "skills",
        "market_dependency": "local",

        "strengths": [
            "Relatively low initial equipment requirement",
            "Can operate from a small premises",
            "Potential for customised services",
        ],

        "risks": [
            "Seasonal demand",
            "Skill dependence",
            "Local competition",
        ],
    },

    "Food Processing": {
        "demand_signal": 0.70,
        "resource_relevance": 0.70,
        "market_access": 0.60,
        "monthly_revenue_factor": 0.78,
        "operating_cost_ratio": 0.74,
        "seasonality_risk": 0.45,
        "supply_chain_risk": 0.40,
        "capital_intensity": 0.70,

        "resource_dependency": "agriculture",
        "market_dependency": "local",

        "strengths": [
            "Value addition to local produce",
            "Potential to serve nearby markets",
            "Potential for differentiated products",
        ],

        "risks": [
            "Raw-material seasonality",
            "Quality-control requirements",
            "Distribution constraints",
        ],
    },

    "Repair Shop": {
        "demand_signal": 0.70,
        "resource_relevance": 0.45,
        "market_access": 0.70,
        "monthly_revenue_factor": 0.68,
        "operating_cost_ratio": 0.58,
        "seasonality_risk": 0.15,
        "supply_chain_risk": 0.35,
        "capital_intensity": 0.50,

        "resource_dependency": "skills",
        "market_dependency": "local",

        "strengths": [
            "Recurring repair demand",
            "Relatively low inventory requirement",
            "Potential for doorstep service",
        ],

        "risks": [
            "Skill dependency",
            "Spare-part availability",
            "Local competition",
        ],
    },

    "DEFAULT": {
        "demand_signal": 0.60,
        "resource_relevance": 0.50,
        "market_access": 0.60,
        "monthly_revenue_factor": 0.65,
        "operating_cost_ratio": 0.70,
        "seasonality_risk": 0.30,
        "supply_chain_risk": 0.40,
        "capital_intensity": 0.55,

        "resource_dependency": "local_resources",
        "market_dependency": "local",

        "strengths": [
            "Potential local demand",
        ],

        "risks": [
            "Business-specific economics require validation",
        ],
    },
}


def normalize_category(category: str) -> str:
    """
    Normalize business category without inventing a category.
    """
    if category is None:
        return ""

    return str(category).strip()


def get_business_economics(category: str) -> Dict[str, Any]:
    """
    Return transparent planning assumptions for a business category.

    Unknown categories use DEFAULT assumptions.
    """
    normalized = normalize_category(category)

    economics = BUSINESS_ECONOMICS.get(
        normalized,
        BUSINESS_ECONOMICS["DEFAULT"],
    )

    return {
        **economics,
        "category": normalized or "Unknown",
        "assumption_status": "planning_assumption",
    }