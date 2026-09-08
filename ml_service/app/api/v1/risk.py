"""
Module 9 — Risk Analysis

PHASE 0:

Risk descriptions must distinguish between:

1. identifiable competitors found in available data
2. estimated/unknown competition
3. actual absence of competition

The system must never tell the entrepreneur that zero identifiable
competitors means zero real competitors.
"""

from fastapi import APIRouter

from app.schemas.models import (
    RiskRequest,
    RiskResponse,
    RiskItem,
)

from app.data_access.villages import find_village


router = APIRouter()


LIVESTOCK_DEPENDENT = {
    "Dairy",
    "Food Processing",
}

SINGLE_BUYER_PRONE = {
    "Dairy",
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
                for business in village_record.get(
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


@router.post(
    "/risks",
    response_model=RiskResponse,
)
def analyze_risks(
    payload: RiskRequest,
):
    geo = payload.geoContext
    risks = []
    category = payload.businessCategory

    if category in LIVESTOCK_DEPENDENT:
        if geo.livestockIndex == "unknown":
            severity = "medium"
        elif geo.livestockIndex == "low":
            severity = "high"
        else:
            severity = "medium"

        risks.append(
            RiskItem(
                type="seasonal_demand",
                severity=severity,
                description=(
                    "Demand and input availability may "
                    "fluctuate seasonally for "
                    "livestock-dependent businesses."
                ),
                mitigation=(
                    "Validate seasonal demand and consider "
                    "value-added products or multiple "
                    "distribution channels."
                ),
            )
        )

    if category in SINGLE_BUYER_PRONE:
        risks.append(
            RiskItem(
                type="single_buyer_dependency",
                severity="high",
                description=(
                    "Reliance on a single cooperative or "
                    "buyer can increase revenue concentration risk."
                ),
                mitigation=(
                    "Diversify distribution across cooperative, "
                    "local market, and direct customers."
                ),
            )
        )

    competitor_count = _category_competitor_count(
        geo,
        category,
    )

    if competitor_count is None:
        risks.append(
            RiskItem(
                type="competition_data_gap",
                severity="medium",
                description=(
                    "A reliable category-specific competitor "
                    "count is not currently available for this "
                    "location. Actual informal or unlisted "
                    "competition may be higher."
                ),
                mitigation=(
                    "Conduct a local market walk or field validation "
                    "before committing capital."
                ),
            )
        )
    else:
        if competitor_count > 7:
            comp_severity = "high"
        elif competitor_count > 3:
            comp_severity = "medium"
        else:
            comp_severity = "low"

        risks.append(
            RiskItem(
                type="competition",
                severity=comp_severity,
                description=(
                    f"{competitor_count} identifiable "
                    f"{category.lower()} businesses were found "
                    "in the available local data."
                ),
                mitigation=(
                    "Differentiate on service, delivery, "
                    "quality, product mix, or customer segment "
                    "rather than competing only on price."
                ),
            )
        )

    if (
        geo.dataConfidence == "low"
        or geo.provenance.coverage
        in {
            "no_matching_village_record",
            "unknown",
        }
    ):
        risks.append(
            RiskItem(
                type="data_confidence",
                severity="medium",
                description=(
                    "Limited location-specific evidence is "
                    "currently available. Some business, demand, "
                    "pricing, and competition values may be incomplete."
                ),
                mitigation=(
                    "Validate customer demand, competitors, "
                    "prices, and operating costs locally before "
                    "making an investment decision."
                ),
            )
        )

    risks.append(
        RiskItem(
            type="price_volatility",
            severity="low",
            description=(
                "Input costs and selling prices may change "
                "with broader market conditions."
            ),
            mitigation=(
                "Maintain a working-capital buffer and "
                "review supplier and customer prices regularly."
            ),
        )
    )

    return RiskResponse(
        risks=risks
    )