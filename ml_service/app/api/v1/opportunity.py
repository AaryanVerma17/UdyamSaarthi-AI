"""
Module 4 — Opportunity Finder

PHASE 0:

Alternative businesses must not be ranked using a fake competitor count.

An alternative is currently ranked using the available deterministic
baseline score, but its evidence status is exposed.

A future phase will replace this with a multi-factor ranking:

Demand
+ competition
+ capital requirement
+ profitability
+ risk
+ local resources
+ repayment feasibility
"""

from fastapi import APIRouter

from app.schemas.models import (
    OpportunityRequest,
    OpportunityResponse,
    OpportunityItem,
)

from app.api.v1.viability import (
    compute_score,
    BUSINESS_BASE_SCORE,
)

from app.api.v1.competitor_mapping import (
    classify as classify_competition,
)

from app.data_access.villages import (
    find_village,
)


router = APIRouter()


ALL_CATEGORIES = list(
    BUSINESS_BASE_SCORE.keys()
)


IMPROVEMENT_SUGGESTIONS = {
    "Dairy": [
        "Home delivery subscription",
        "Paneer/curd/ghee value addition",
        "Cattle-feed side line",
    ],
    "Kirana": [
        "Home delivery for bulk orders",
        "Stock underserved daily-need SKUs",
        "Loyalty/subscription model",
    ],
    "Tailoring": [
        "Uniform/bulk institutional contracts",
        "Alteration and rental services",
        "Online measurement booking",
    ],
    "Food Processing": [
        "Direct-to-consumer packaging",
        "Local restaurant supply contracts",
        "Value-added product lines",
    ],
    "Repair Shop": [
        "Home-visit repair service",
        "Annual maintenance contracts",
        "Spare-parts side inventory",
    ],
}


def _category_competitor_count(
    geo_context,
    category,
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
                == category.strip().lower()
            ]
        )

    return None


def _classification_for_category(
    geo_context,
    category,
):
    count = _category_competitor_count(
        geo_context,
        category,
    )

    if count is None:
        return None

    return classify_competition(
        count
    )


def _evidence_status(
    geo_context,
    category,
):
    count = _category_competitor_count(
        geo_context,
        category,
    )

    if count is None:
        return "preliminary"

    if (
        geo_context.dataConfidence
        == "high"
    ):
        return "evidence_based"

    return "preliminary"


@router.post(
    "/opportunities",
    response_model=OpportunityResponse,
)
def rank_opportunities(
    payload: OpportunityRequest,
):
    requested_score = compute_score(
        payload.geoContext,
        payload.requestedBusiness,
    )

    requested_classification = (
        _classification_for_category(
            payload.geoContext,
            payload.requestedBusiness,
        )
    )

    candidates = []

    for category in ALL_CATEGORIES:
        if (
            category.lower()
            == payload.requestedBusiness.strip().lower()
        ):
            continue

        classification = (
            _classification_for_category(
                payload.geoContext,
                category,
            )
        )

        # Only exclude an alternative when we have
        # actual category-specific evidence that it is saturated.
        if (
            classification
            == "highly_saturated"
        ):
            continue

        candidates.append(
            OpportunityItem(
                business=category,
                score=compute_score(
                    payload.geoContext,
                    category,
                ),
                classification=classification,
                evidenceStatus=_evidence_status(
                    payload.geoContext,
                    category,
                ),
            )
        )

    candidates.sort(
        key=lambda item: item.score,
        reverse=True,
    )

    improvement_suggestions = (
        IMPROVEMENT_SUGGESTIONS.get(
            payload.requestedBusiness,
            [
                "Differentiate through service",
                "Target an underserved customer segment",
            ],
        )
    )

    return OpportunityResponse(
        requestedBusiness=OpportunityItem(
            business=payload.requestedBusiness,
            score=requested_score,
            classification=requested_classification,
            evidenceStatus=_evidence_status(
                payload.geoContext,
                payload.requestedBusiness,
            ),
        ),
        alternatives=candidates[:3],
        improvementSuggestions=(
            improvement_suggestions
        ),
    )