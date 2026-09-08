"""
Module 2 — Business Viability Engine
PHASE 5: Evidence-weighted deterministic scoring
"""

from fastapi import APIRouter

from app.schemas.models import (
    ViabilityRequest,
    ViabilityResponse,
)

from app.data_access.villages import find_village

router = APIRouter()


# ---------------------------------------------------------------------
# Base business priors
# ---------------------------------------------------------------------

BUSINESS_BASE_SCORE = {
    "Dairy": 58,
    "Kirana": 54,
    "Tailoring": 55,
    "Food Processing": 57,
    "Repair Shop": 53,
}

PURCHASING_POWER_SCORE = {
    "low": -10,
    "low-medium": -4,
    "medium": 0,
    "medium-high": 6,
    "high": 12,
    "unknown": 0,
}

LIVESTOCK_SCORE = {
    "low": 0,
    "medium": 4,
    "high": 8,
    "unknown": 0,
}

MARKET_SCORE = {
    0: -6,
    1: 2,
    2: 5,
    3: 7,
}


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------

def has_location_evidence(ctx):
    return (
        ctx.consumerBase > 0
        or ctx.purchasingPowerIndex != "unknown"
        or ctx.livestockIndex != "unknown"
        or len(ctx.marketsAndHaats) > 0
        or len(ctx.distributionChannels) > 0
    )


def competitor_count(ctx, business):
    if not ctx.village:
        return None

    record = find_village(ctx.village)

    if not record:
        return None

    return len(
        [
            b
            for b in record.get("existingBusinesses", [])
            if b.get("category", "").lower() == business.lower()
        ]
    )


# ---------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------

def compute_score(ctx, business):

    if not has_location_evidence(ctx):
        return 50

    score = BUSINESS_BASE_SCORE.get(business, 50)

    score += PURCHASING_POWER_SCORE.get(
        ctx.purchasingPowerIndex,
        0,
    )

    if business in ["Dairy", "Food Processing"]:
        score += LIVESTOCK_SCORE.get(
            ctx.livestockIndex,
            0,
        )

    market_count = min(
        len(ctx.marketsAndHaats),
        3,
    )

    score += MARKET_SCORE[market_count]

    if ctx.consumerBase >= 6000:
        score += 8
    elif ctx.consumerBase >= 3500:
        score += 4
    elif ctx.consumerBase < 1800:
        score -= 6

    competitors = competitor_count(ctx, business)

    if competitors is not None:
        if competitors <= 2:
            score += 5
        elif competitors <= 5:
            score -= 2
        else:
            score -= min(
                competitors * 3,
                18,
            )

    if ctx.dataConfidence == "low":
        score = round(score * 0.9 + 5)

    return max(0, min(100, score))


# ---------------------------------------------------------------------
# Drivers
# ---------------------------------------------------------------------

def build_drivers(ctx, business):

    drivers = []

    if ctx.consumerBase >= 5000:
        drivers.append(
            "Strong local consumer base"
        )

    if ctx.purchasingPowerIndex in [
        "medium-high",
        "high",
    ]:
        drivers.append(
            "Above-average purchasing power"
        )

    if (
        business == "Dairy"
        and ctx.livestockIndex in [
            "medium",
            "high",
        ]
    ):
        drivers.append(
            "Favorable livestock ecosystem"
        )

    if len(ctx.marketsAndHaats) >= 2:
        drivers.append(
            "Multiple nearby markets improve access"
        )

    return drivers


# ---------------------------------------------------------------------
# SWOT
# ---------------------------------------------------------------------

def build_swot(ctx, business, score):

    strengths = []
    weaknesses = []
    opportunities = []
    threats = []

    if ctx.consumerBase >= 5000:
        strengths.append(
            "Large addressable local customer base"
        )

    if business == "Dairy" and ctx.livestockIndex == "high":
        strengths.append(
            "Strong livestock ecosystem"
        )

    if ctx.dataConfidence == "low":
        weaknesses.append(
            "Limited verified village-level evidence"
        )

    if len(ctx.marketsAndHaats) <= 1:
        weaknesses.append(
            "Market access is relatively limited"
        )

    opportunities.append(
        "Differentiate through quality and local trust"
    )

    threats.append(
        "Competition and input-price volatility"
    )

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "opportunities": opportunities,
        "threats": threats,
    }


# ---------------------------------------------------------------------
# Explanation
# ---------------------------------------------------------------------

def explanation(score, business):

    if score >= 75:
        return (
            f"{business} demonstrates strong local viability based on "
            "available evidence, but should still be validated with field demand."
        )

    if score >= 50:
        return (
            f"{business} appears moderately viable. The opportunity exists, "
            "but differentiation and local validation remain important."
        )

    return (
        f"{business} currently shows limited viability under the available "
        "evidence and requires further validation before investment."
    )


# ---------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------

@router.post(
    "/viability",
    response_model=ViabilityResponse,
)
def score_viability(payload: ViabilityRequest):

    score = compute_score(
        payload.geoContext,
        payload.businessCategory,
    )

    if score >= 75:
        label = "High Potential"
    elif score >= 50:
        label = "Moderate Potential"
    else:
        label = "Low Potential"

    evidence = has_location_evidence(
        payload.geoContext
    )

    limitations = []

    if not evidence:
        limitations.append(
            "No reliable village-specific market evidence was available."
        )

    if payload.geoContext.dataConfidence == "low":
        limitations.append(
            "Available evidence has low confidence."
        )

    if not limitations:
        limitations.append(
            "Results should be validated with local operating economics."
        )

    return ViabilityResponse(
        score=score,
        label=label,
        explanation=explanation(
            score,
            payload.businessCategory,
        ),
        breakEvenMonths=None,
        expectedCashFlow=None,
        drivers=build_drivers(
            payload.geoContext,
            payload.businessCategory,
        ),
        swot=build_swot(
            payload.geoContext,
            payload.businessCategory,
            score,
        ),
        estimateStatus=(
            "preliminary"
            if evidence
            else "insufficient_data"
        ),
        dataLimitations=limitations,
    )