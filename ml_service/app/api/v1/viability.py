"""
UdyamSaarthi-AI
Phase 7 — Dynamic Business Viability Engine

Purpose
-------
Evaluate:

Location
+ Consumer Base
+ Purchasing Power
+ Category Competition
+ Market Access
+ Local Resources
+ Business Economics
+ Profitability
+ Risk Exposure

The result is a VIABILITY SCORE from 0-100.

IMPORTANT
---------
This is NOT a probability of success.

Example:
    82/100 Viability Score

must never be presented as:

    82% probability of success

The engine is deterministic.

The LLM is NOT used for scoring.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter

from app.schemas.models import (
    ViabilityRequest,
    ViabilityResponse,
)

from app.data.business_economics import (
    get_business_economics,
)


router = APIRouter()


# ---------------------------------------------------------------------
# Backward-compatible category priors
# ---------------------------------------------------------------------
#
# opportunity.py imports these values.
#
# They are NOT final viability scores.
# They are only category priors used as a stabilizing baseline.
#

BUSINESS_BASE_SCORE = {
    "Dairy": 55,
    "Kirana": 50,
    "Tailoring": 52,
    "Food Processing": 54,
    "Repair Shop": 50,
}


# Kept for compatibility with older modules/tests.
PURCHASING_POWER_SCORE = {
    "low": -8,
    "low-medium": -3,
    "medium": 0,
    "medium-high": 5,
    "high": 10,
    "unknown": 0,
}


# Kept for compatibility with older modules/tests.
LIVESTOCK_RELEVANCE = {
    "Dairy": True,
    "Food Processing": True,
}


# ---------------------------------------------------------------------
# Dynamic model weights
# ---------------------------------------------------------------------

DEFAULT_WEIGHTS = {
    "consumer": 0.20,
    "purchasingPower": 0.15,
    "resources": 0.15,
    "competition": 0.15,
    "marketAccess": 0.10,
    "profitability": 0.25,
}


# ---------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------

def clamp(
    value: float,
    minimum: float = 0.0,
    maximum: float = 1.0,
) -> float:
    return max(
        minimum,
        min(maximum, value),
    )


def normalise_unit_interval(value: Any) -> float:
    """
    Convert a value to [0,1].

    Supports:
    - numeric values already in [0,1]
    - numeric percentages
    """
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return 0.5

    if numeric > 1:
        numeric = numeric / 100.0

    return clamp(numeric)


def round_signal(value: float) -> float:
    return round(
        clamp(value),
        3,
    )


def get_value(
    obj: Any,
    field: str,
    default: Any = None,
) -> Any:

    if obj is None:
        return default

    if isinstance(obj, dict):
        return obj.get(field, default)

    return getattr(
        obj,
        field,
        default,
    )


# ---------------------------------------------------------------------
# Evidence detection
# ---------------------------------------------------------------------

def has_location_evidence(
    geo_context: Any,
) -> bool:

    if geo_context is None:
        return False

    consumer_base = get_value(
        geo_context,
        "consumerBase",
        0,
    )

    purchasing_power = get_value(
        geo_context,
        "purchasingPowerIndex",
        "unknown",
    )

    livestock = get_value(
        geo_context,
        "livestockIndex",
        "unknown",
    )

    markets = get_value(
        geo_context,
        "marketsAndHaats",
        [],
    )

    distribution = get_value(
        geo_context,
        "distributionChannels",
        [],
    )

    try:
        consumer_exists = float(
            consumer_base
        ) > 0
    except (TypeError, ValueError):
        consumer_exists = False

    return bool(
        consumer_exists
        or purchasing_power not in (
            None,
            "",
            "unknown",
        )
        or livestock not in (
            None,
            "",
            "unknown",
        )
        or markets
        or distribution
    )


# ---------------------------------------------------------------------
# Consumer signal
# ---------------------------------------------------------------------

def consumer_signal(
    geo_context: Any,
) -> Dict[str, Any]:

    value = get_value(
        geo_context,
        "consumerBase",
        None,
    )

    if value is None:
        return {
            "signal": 0.5,
            "available": False,
            "reason": "Consumer-base evidence unavailable.",
        }

    try:
        consumer_base = float(value)
    except (TypeError, ValueError):
        return {
            "signal": 0.5,
            "available": False,
            "reason": "Consumer-base evidence could not be interpreted.",
        }

    if consumer_base <= 0:
        return {
            "signal": 0.5,
            "available": False,
            "reason": "Consumer-base evidence is unavailable.",
        }

    # Transparent bounded scaling.
    #
    # 1,000 consumers -> ~0.35
    # 4,000 consumers -> ~0.65
    # 8,000+ consumers -> 0.90+
    signal = clamp(
        0.25
        + (
            consumer_base / 10000.0
        ) * 0.75
    )

    return {
        "signal": signal,
        "available": True,
        "reason": "Available consumer-base evidence supports local demand.",
    }


# ---------------------------------------------------------------------
# Purchasing power
# ---------------------------------------------------------------------

def purchasing_power_signal(
    geo_context: Any,
) -> Dict[str, Any]:

    value = get_value(
        geo_context,
        "purchasingPowerIndex",
        "unknown",
    )

    mapping = {
        "low": 0.30,
        "low-medium": 0.42,
        "medium": 0.55,
        "medium-high": 0.72,
        "high": 0.88,
        "unknown": 0.50,
    }

    normalized = str(
        value or "unknown"
    ).strip().lower()

    signal = mapping.get(
        normalized,
        0.50,
    )

    return {
        "signal": signal,
        "available": normalized != "unknown",
        "reason": (
            f"Purchasing-power signal is '{normalized}'."
        ),
    }


# ---------------------------------------------------------------------
# Resource signal
# ---------------------------------------------------------------------

def resource_signal(
    geo_context: Any,
    economics: Dict[str, Any],
) -> Dict[str, Any]:

    livestock = str(
        get_value(
            geo_context,
            "livestockIndex",
            "unknown",
        )
        or "unknown"
    ).strip().lower()

    dependency = economics.get(
        "resource_dependency",
        "local_resources",
    )

    if dependency == "livestock":
        mapping = {
            "high": 0.90,
            "medium": 0.65,
            "low": 0.35,
            "unknown": 0.50,
        }

        return {
            "signal": mapping.get(
                livestock,
                0.50,
            ),
            "available": livestock != "unknown",
            "reason": (
                "Livestock availability is relevant to this business."
            ),
        }

    if dependency == "agriculture":
        mapping = {
            "high": 0.85,
            "medium": 0.65,
            "low": 0.40,
            "unknown": 0.50,
        }

        return {
            "signal": mapping.get(
                livestock,
                0.50,
            ),
            "available": livestock != "unknown",
            "reason": (
                "Local agricultural/resource availability is relevant."
            ),
        }

    # Skills/distribution/local-resource businesses
    distribution = get_value(
        geo_context,
        "distributionChannels",
        [],
    )

    markets = get_value(
        geo_context,
        "marketsAndHaats",
        [],
    )

    if distribution or markets:
        return {
            "signal": 0.72,
            "available": True,
            "reason": (
                "Available market/distribution infrastructure supports "
                "resource access."
            ),
        }

    return {
        "signal": 0.50,
        "available": False,
        "reason": (
            "Business-specific local resource evidence is limited."
        ),
    }


# ---------------------------------------------------------------------
# Market access
# ---------------------------------------------------------------------

def market_access_signal(
    geo_context: Any,
    economics: Dict[str, Any],
) -> Dict[str, Any]:

    markets = get_value(
        geo_context,
        "marketsAndHaats",
        [],
    )

    distribution = get_value(
        geo_context,
        "distributionChannels",
        [],
    )

    market_count = (
        len(markets)
        if isinstance(markets, list)
        else 0
    )

    distribution_count = (
        len(distribution)
        if isinstance(distribution, list)
        else 0
    )

    if market_count == 0 and distribution_count == 0:
        return {
            "signal": normalise_unit_interval(
                economics.get(
                    "market_access",
                    0.50,
                )
            ),
            "available": False,
            "reason": (
                "No specific local market-access evidence was available."
            ),
        }

    infrastructure_signal = clamp(
        0.45
        + market_count * 0.10
        + distribution_count * 0.08
    )

    # Blend observed infrastructure with category prior.
    category_signal = normalise_unit_interval(
        economics.get(
            "market_access",
            0.50,
        )
    )

    signal = (
        infrastructure_signal * 0.70
        + category_signal * 0.30
    )

    return {
        "signal": clamp(signal),
        "available": True,
        "reason": (
            "Available markets and/or distribution channels support "
            "market access."
        ),
    }


# ---------------------------------------------------------------------
# Competition
# ---------------------------------------------------------------------

def get_category_competition(
    geo_context: Any,
    business_category: str,
) -> Dict[str, Any]:

    competition = get_value(
        geo_context,
        "competition",
        None,
    )

    if competition is None:
        return {
            "count": None,
            "classification": "data_unavailable",
            "available": False,
            "identifiable": False,
        }

    count = get_value(
        competition,
        "count",
        None,
    )

    identifiable = bool(
        get_value(
            competition,
            "identifiable",
            False,
        )
    )

    classification = get_value(
        competition,
        "classification",
        None,
    )

    if count is None or not identifiable:
        return {
            "count": None,
            "classification": (
                classification
                or "data_unavailable"
            ),
            "available": False,
            "identifiable": False,
        }

    try:
        count = float(count)
    except (TypeError, ValueError):
        return {
            "count": None,
            "classification": "data_unavailable",
            "available": False,
            "identifiable": False,
        }

    return {
        "count": count,
        "classification": (
            classification
            or "unknown"
        ),
        "available": True,
        "identifiable": True,
    }


def competition_signal(
    geo_context: Any,
    business_category: str,
) -> Dict[str, Any]:

    competition = get_category_competition(
        geo_context,
        business_category,
    )

    count = competition["count"]

    if count is None:
        # Neutral, NOT favourable.
        return {
            "signal": 0.50,
            "available": False,
            "count": None,
            "classification": "data_unavailable",
            "reason": (
                "Category-specific competition evidence is unavailable. "
                "The model does not interpret missing competitors as zero."
            ),
        }

    if count <= 3:
        signal = 0.90

    elif count <= 7:
        signal = 0.65

    else:
        # Saturation reduces viability signal,
        # but does NOT automatically reject the business.
        signal = 0.35

    return {
        "signal": signal,
        "available": True,
        "count": count,
        "classification": competition[
            "classification"
        ],
        "reason": (
            f"{int(count)} identifiable competitors were used "
            "for the competition signal."
        ),
    }


# ---------------------------------------------------------------------
# Profitability
# ---------------------------------------------------------------------

def profitability_signal(
    geo_context: Any,
    economics: Dict[str, Any],
) -> Dict[str, Any]:

    revenue_factor = normalise_unit_interval(
        economics.get(
            "monthly_revenue_factor",
            0.65,
        )
    )

    cost_ratio = normalise_unit_interval(
        economics.get(
            "operating_cost_ratio",
            0.70,
        )
    )

    seasonality_risk = normalise_unit_interval(
        economics.get(
            "seasonality_risk",
            0.30,
        )
    )

    supply_chain_risk = normalise_unit_interval(
        economics.get(
            "supply_chain_risk",
            0.40,
        )
    )

    # Higher revenue potential improves the signal.
    revenue_component = revenue_factor

    # Lower costs improve the signal.
    margin_component = 1.0 - cost_ratio

    # Lower operational risks improve the signal.
    risk_component = (
        1.0
        - (
            seasonality_risk * 0.50
            + supply_chain_risk * 0.50
        )
    )

    signal = (
        revenue_component * 0.45
        + margin_component * 0.35
        + risk_component * 0.20
    )

    return {
        "signal": clamp(signal),
        "available": True,
        "reason": (
            "Profitability signal combines category-level revenue "
            "potential, operating-cost ratio and operating risks."
        ),
    }


# ---------------------------------------------------------------------
# Monthly cash-flow planning estimate
# ---------------------------------------------------------------------

def estimate_monthly_cash_flow(
    geo_context: Any,
    economics: Dict[str, Any],
) -> Optional[float]:

    consumer_base = get_value(
        geo_context,
        "consumerBase",
        None,
    )

    if consumer_base is None:
        return None

    try:
        consumer_base = float(
            consumer_base
        )
    except (TypeError, ValueError):
        return None

    if consumer_base <= 0:
        return None

    revenue_factor = max(
        0.0,
        float(
            economics.get(
                "monthly_revenue_factor",
                0.65,
            )
        ),
    )

    cost_ratio = clamp(
        float(
            economics.get(
                "operating_cost_ratio",
                0.70,
            )
        )
    )

    # Planning model only.
    #
    # The formula intentionally remains transparent.
    estimated_monthly_revenue = (
        consumer_base
        * revenue_factor
        * 100.0
    )

    estimated_monthly_cash_flow = (
        estimated_monthly_revenue
        * (1.0 - cost_ratio)
    )

    return round(
        max(
            0.0,
            estimated_monthly_cash_flow,
        ),
        2,
    )


# ---------------------------------------------------------------------
# Break-even estimate
# ---------------------------------------------------------------------

def estimate_break_even_months(
    expected_cash_flow: Optional[float],
    economics: Dict[str, Any],
) -> Optional[float]:

    if expected_cash_flow is None:
        return None

    if expected_cash_flow <= 0:
        return None

    capital_intensity = clamp(
        float(
            economics.get(
                "capital_intensity",
                0.55,
            )
        )
    )

    # This is a relative planning proxy.
    #
    # It must not be interpreted as a guaranteed
    # financial break-even period.
    planning_investment_proxy = (
        100000.0
        * (
            0.50
            + capital_intensity
        )
    )

    months = (
        planning_investment_proxy
        / expected_cash_flow
    )

    return round(
        max(1.0, months),
        1,
    )


# ---------------------------------------------------------------------
# Dynamic score
# ---------------------------------------------------------------------

def _compute_result(
    geo_context: Any,
    business_category: str,
) -> Dict[str, Any]:

    category = str(
        business_category or ""
    ).strip()

    economics = get_business_economics(
        category
    )

    consumer = consumer_signal(
        geo_context
    )

    purchasing = purchasing_power_signal(
        geo_context
    )

    resources = resource_signal(
        geo_context,
        economics,
    )

    competition = competition_signal(
        geo_context,
        category,
    )

    market_access = market_access_signal(
        geo_context,
        economics,
    )

    profitability = profitability_signal(
        geo_context,
        economics,
    )

    signals = {
        "consumer": round_signal(
            consumer["signal"]
        ),
        "purchasingPower": round_signal(
            purchasing["signal"]
        ),
        "resources": round_signal(
            resources["signal"]
        ),
        "competition": round_signal(
            competition["signal"]
        ),
        "marketAccess": round_signal(
            market_access["signal"]
        ),
        "profitability": round_signal(
            profitability["signal"]
        ),
    }

    weights = dict(
        DEFAULT_WEIGHTS
    )

    dynamic_score = (
        signals["consumer"]
        * weights["consumer"]
        +
        signals["purchasingPower"]
        * weights["purchasingPower"]
        +
        signals["resources"]
        * weights["resources"]
        +
        signals["competition"]
        * weights["competition"]
        +
        signals["marketAccess"]
        * weights["marketAccess"]
        +
        signals["profitability"]
        * weights["profitability"]
    )

    # Category prior.
    #
    # This keeps the deterministic model stable while allowing
    # local evidence to materially change the result.
    category_prior = (
        BUSINESS_BASE_SCORE.get(
            category,
            50,
        )
        / 100.0
    )

    score = (
        dynamic_score * 0.65
        + category_prior * 0.35
    ) * 100.0

    score = int(
        round(
            clamp(
                score / 100.0
            ) * 100
        )
    )

    # -------------------------------------------------------------
    # Label
    # -------------------------------------------------------------

    if score >= 75:
        label = "High Potential"

    elif score >= 50:
        label = "Moderate Potential"

    else:
        label = "Low Potential"

    # -------------------------------------------------------------
    # Drivers
    # -------------------------------------------------------------

    drivers: List[str] = []

    if consumer["signal"] >= 0.65:
        drivers.append(
            "Strong local consumer base"
        )

    if resources["signal"] >= 0.70:
        drivers.append(
            "Strong local resource relevance"
        )

    if competition.get(
        "available",
        False,
    ):
        if competition.get(
            "count",
            0,
        ) <= 3:
            drivers.append(
                "Limited identifiable competition"
            )

    if market_access["signal"] >= 0.70:
        drivers.append(
            "Access to local markets or distribution channels"
        )

    if profitability["signal"] >= 0.65:
        drivers.append(
            "Relatively favourable planning economics"
        )

    if not drivers:
        drivers.append(
            "Limited positive drivers from currently available evidence"
        )

    # -------------------------------------------------------------
    # Limitations
    # -------------------------------------------------------------

    limitations: List[str] = []

    if not consumer["available"]:
        limitations.append(
            "Consumer-base evidence is unavailable or incomplete."
        )

    if not purchasing["available"]:
        limitations.append(
            "Purchasing-power evidence is incomplete."
        )

    if not resources["available"]:
        limitations.append(
            "Business-specific local resource evidence is limited."
        )

    if not competition["available"]:
        limitations.append(
            "Category-specific competition evidence is incomplete or unavailable."
        )
        limitations.append(
            "Missing competition data is not interpreted as zero competitors."
        )

    if not market_access["available"]:
        limitations.append(
            "Specific local market-access evidence is limited."
        )

    limitations.append(
        "Some business-economic signals use category-level planning assumptions "
        "and should be validated locally."
    )

    population_is_estimate = bool(
        get_value(
            geo_context,
            "populationIsEstimate",
            False,
        )
    )

    if population_is_estimate:
        limitations.append(
            "Population value is an estimate rather than a directly observed figure."
        )

    # Remove duplicate limitations.
    limitations = list(
        dict.fromkeys(
            limitations
        )
    )

    # -------------------------------------------------------------
    # Data status
    # -------------------------------------------------------------

    location_evidence = has_location_evidence(
        geo_context
    )

    if not location_evidence:
        estimate_status = "planning_estimate"

    elif competition["available"]:
        estimate_status = "evidence_supported"

    else:
        estimate_status = "partially_evidence_supported"

    # -------------------------------------------------------------
    # Cash flow / break-even
    # -------------------------------------------------------------

    expected_cash_flow = estimate_monthly_cash_flow(
        geo_context,
        economics,
    )

    break_even_months = estimate_break_even_months(
        expected_cash_flow,
        economics,
    )

    # -------------------------------------------------------------
    # Explanation
    # -------------------------------------------------------------

    explanation = (
        f"{category or 'This business'} receives a "
        f"{score}/100 viability score based on available local "
        f"evidence and category-level planning assumptions. "
        f"The score is not a probability of success and should "
        f"be interpreted alongside the evidence limitations."
    )

    return {
        "score": score,

        "label": label,

        "estimateStatus": estimate_status,

        "signals": signals,

        "weights": weights,

        "drivers": drivers,

        "limitations": limitations,

        "dataLimitations": limitations,

        "competition": {
            "classification": competition.get(
                "classification",
                "data_unavailable",
            ),
            "count": competition.get(
                "count"
            ),
            "available": competition.get(
                "available",
                False,
            ),
            "identifiable": competition.get(
                "identifiable",
                False,
            ),
        },

        "businessEconomics": {
            "category": category or "Unknown",
            "operatingCostRatio": economics.get(
                "operating_cost_ratio"
            ),
            "seasonalityRisk": economics.get(
                "seasonality_risk"
            ),
            "supplyChainRisk": economics.get(
                "supply_chain_risk"
            ),
            "capitalIntensity": economics.get(
                "capital_intensity"
            ),
            "demandSignal": economics.get(
                "demand_signal"
            ),
            "resourceRelevance": economics.get(
                "resource_relevance"
            ),
            "marketAccess": economics.get(
                "market_access"
            ),
            "monthlyRevenueFactor": economics.get(
                "monthly_revenue_factor"
            ),
            "assumptionStatus": "planning_assumption",
        },

        "expectedCashFlow": expected_cash_flow,

        "breakEvenMonths": break_even_months,

        "explanation": explanation,

        "swot": {
            "strengths": economics.get(
                "strengths",
                [],
            ),

            "weaknesses": [
                "Business economics include planning assumptions."
            ],

            "opportunities": [
                "Validate underserved customer needs locally.",
                "Use local market evidence to refine the business model.",
            ],

            "threats": economics.get(
                "risks",
                [],
            ),
        },
    }


# ---------------------------------------------------------------------
# Backward-compatible API
# ---------------------------------------------------------------------

def compute_score(
    geo_context: Any,
    business_category: str,
) -> int:
    """
    Backward-compatible score API.

    IMPORTANT:
    opportunity.py imports compute_score().
    Do not remove this function.
    """
    result = _compute_result(
        geo_context,
        business_category,
    )

    return int(
        result["score"]
    )


# ---------------------------------------------------------------------
# FastAPI endpoint
# ---------------------------------------------------------------------

@router.post(
    "/viability",
    response_model=ViabilityResponse,
)
def viability(
    request: ViabilityRequest,
):
    result = _compute_result(
        request.geoContext,
        request.businessCategory,
    )

    return ViabilityResponse(
        **result
    )