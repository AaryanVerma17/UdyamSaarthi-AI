"""
Module 2 — Business Viability Engine

PHASE 0 BASELINE

This remains a deterministic baseline until sufficient historical outcome
data exists for a trained model.

Important:

- Business-type scores are NOT treated as facts.
- Missing location data does not become a fabricated score.
- Cash flow and break-even are NOT presented as exact financial forecasts.
- Low-evidence cases are explicitly marked as preliminary.

Later phases will replace this baseline with:

Demand
+ local pricing
+ competition
+ capital requirement
+ operating economics
+ repayment capacity
+ local resource availability
"""

from fastapi import APIRouter

from app.schemas.models import (
    ViabilityRequest,
    ViabilityResponse,
)

from app.data_access.villages import find_village


router = APIRouter()


# These are temporary model priors only.
# They must eventually be replaced by evidence-backed business economics.
BUSINESS_BASE_SCORE = {
    "Dairy": 55,
    "Kirana": 50,
    "Tailoring": 52,
    "Food Processing": 54,
    "Repair Shop": 50,
}


PURCHASING_POWER_SCORE = {
    "low": -8,
    "low-medium": -3,
    "medium": 0,
    "medium-high": 5,
    "high": 10,
    "unknown": 0,
}


LIVESTOCK_RELEVANCE = {
    "Dairy": True,
    "Food Processing": True,
}


def _category_competitor_count(
    geo_context,
    business_category: str,
):
    village_record = (
        find_village(
            geo_context.village
        )
        if geo_context.village
        else None
    )

    if village_record:
        return len(
            [
                business
                for business
                in village_record.get(
                    "existingBusinesses",
                    [],
                )
                if business.get(
                    "category",
                    "",
                ).strip().lower()
                == business_category.strip().lower()
            ]
        )

    return None


def _has_location_evidence(
    geo_context,
):
    return (
        geo_context.consumerBase > 0
        or geo_context.purchasingPowerIndex
        != "unknown"
        or geo_context.livestockIndex
        != "unknown"
        or bool(
            geo_context.marketsAndHaats
        )
        or bool(
            geo_context.distributionChannels
        )
    )


def compute_score(
    geo_context,
    business_category: str,
) -> int:
    """
    Deterministic baseline score.

    Returns a score only when some location evidence exists.

    With no evidence, returns a cautious neutral baseline rather than
    pretending that the business has been evaluated accurately.
    """

    if not _has_location_evidence(
        geo_context
    ):
        return 50

    score = BUSINESS_BASE_SCORE.get(
        business_category,
        50,
    )

    score += PURCHASING_POWER_SCORE.get(
        geo_context.purchasingPowerIndex,
        0,
    )

    if (
        LIVESTOCK_RELEVANCE.get(
            business_category
        )
        and geo_context.livestockIndex
        in ("medium", "high")
    ):
        score += (
            8
            if geo_context.livestockIndex
            == "high"
            else 4
        )

    competitor_count = (
        _category_competitor_count(
            geo_context,
            business_category,
        )
    )

    if competitor_count is not None:
        score -= min(
            competitor_count * 3,
            18,
        )

    if geo_context.consumerBase >= 5000:
        score += 6
    elif (
        geo_context.consumerBase > 0
        and geo_context.consumerBase < 2000
    ):
        score -= 6

    if (
        geo_context.dataConfidence
        == "low"
    ):
        score = round(
            score * 0.85
            + 50 * 0.15
        )

    return max(
        0,
        min(
            100,
            round(score),
        ),
    )


def build_explanation(
    business_category,
    geo_context,
    score,
    label,
):
    reasons = []

    competitor_count = (
        _category_competitor_count(
            geo_context,
            business_category,
        )
    )

    if (
        geo_context.livestockIndex
        in ("medium", "high")
        and LIVESTOCK_RELEVANCE.get(
            business_category
        )
    ):
        reasons.append(
            f"{geo_context.livestockIndex} "
            "livestock activity"
        )

    if (
        geo_context.purchasingPowerIndex
        in ("medium-high", "high")
    ):
        reasons.append(
            "relatively stronger purchasing power"
        )

    if competitor_count is not None:
        if competitor_count <= 3:
            reasons.append(
                "limited identifiable competition"
            )
        elif competitor_count > 7:
            reasons.append(
                "high identifiable competition"
            )

    if not reasons:
        reasons.append(
            "limited available local evidence"
        )

    evidence_note = (
        " This is a preliminary baseline assessment, "
        "not a guaranteed business outcome."
    )

    return (
        f"{business_category} shows "
        f"{label.lower()} under the current "
        f"evidence available for this area, "
        f"driven by {', '.join(reasons)}."
        f"{evidence_note}"
    )


@router.post(
    "/viability",
    response_model=ViabilityResponse,
)
def score_viability(
    payload: ViabilityRequest,
):
    score = compute_score(
        payload.geoContext,
        payload.businessCategory,
    )

    label = (
        "High Potential"
        if score >= 75
        else (
            "Moderate Potential"
            if score >= 50
            else "Low Potential"
        )
    )

    explanation = build_explanation(
        payload.businessCategory,
        payload.geoContext,
        score,
        label,
    )

    has_evidence = _has_location_evidence(
        payload.geoContext
    )

    data_limitations = []

    if not has_evidence:
        data_limitations.append(
            "No reliable village-specific market record was available."
        )

    if (
        payload.geoContext.dataConfidence
        == "low"
    ):
        data_limitations.append(
            "Available location evidence has low confidence."
        )

    if not data_limitations:
        data_limitations.append(
            "This is a deterministic baseline and should be validated "
            "against local operating costs and demand."
        )

    return ViabilityResponse(
        score=score,
        label=label,
        explanation=explanation,

        # Phase 0 deliberately does not invent financial forecasts.
        breakEvenMonths=None,
        expectedCashFlow=None,

        drivers=[
            "local_demand",
            "competition_density",
            "purchasing_power",
            "livestock_activity",
        ],

        swot={
            "strengths": (
                [
                    "Some local evidence supports the business opportunity."
                ]
                if has_evidence
                else []
            ),
            "weaknesses": [
                "Detailed business-level operating economics "
                "are not yet available."
            ],
            "opportunities": [
                "Validate underserved customer needs locally."
            ],
            "threats": [
                "Competition and input-price uncertainty."
            ],
        },

        estimateStatus=(
            "preliminary"
            if has_evidence
            else "insufficient_data"
        ),

        dataLimitations=data_limitations,
    )