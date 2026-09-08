"""
Module 3 — Competitor Mapping

PHASE 0:

Never convert general business density into an exact category-specific
competitor count.

If identifiable business records exist, count them.

If they do not exist, return zero identifiable competitors with an
explicit data-coverage warning.

Zero therefore means:

"No identifiable competitors were found in the available data"

and NOT:

"There are no competitors in reality."
"""

from fastapi import APIRouter

from app.schemas.models import (
    CompetitorMappingRequest,
    CompetitorMappingResponse,
    CompetitorPoint,
)

from app.data_access.villages import find_village


router = APIRouter()


def classify(count: int) -> str:
    if count <= 3:
        return "under_served"

    if count <= 7:
        return "moderately_competitive"

    return "highly_saturated"


def _matching_businesses(
    village_record,
    business_category: str,
):
    if not village_record:
        return []

    requested = (
        business_category.strip().lower()
    )

    return [
        business
        for business in village_record.get(
            "existingBusinesses",
            [],
        )
        if business.get(
            "category",
            "",
        ).strip().lower()
        == requested
    ]


@router.post(
    "/competitor-mapping",
    response_model=CompetitorMappingResponse,
)
def map_competitors(
    payload: CompetitorMappingRequest,
):
    village_record = (
        find_village(
            payload.geoContext.village
        )
        if payload.geoContext.village
        else None
    )

    matching = _matching_businesses(
        village_record,
        payload.businessCategory,
    )

    if village_record is not None:
        points = [
            CompetitorPoint(
                lat=float(
                    business["lat"]
                ),
                lng=float(
                    business["lng"]
                ),
                name=business["name"],
                category=business["category"],
            )
            for business in matching
            if "lat" in business
            and "lng" in business
        ]

        count = len(matching)

        return CompetitorMappingResponse(
            count=count,
            classification=classify(count),
            points=points,
            dataConfidenceNote=(
                f"{count} identifiable "
                f"{payload.businessCategory.lower()} "
                "businesses were found in the available "
                "local dataset. Informal, unregistered, "
                "or unlisted businesses may not be captured."
            ),
            lastUpdated=village_record.get(
                "lastUpdated"
            ),
            identifiable=True,
            estimated=False,
            source=village_record.get(
                "dataSource",
                "local_dataset",
            ),
            coverage=village_record.get(
                "coverage",
                "available_local_records",
            ),
        )

    return CompetitorMappingResponse(
        count=0,
        classification=classify(0),
        points=[],
        dataConfidenceNote=(
            "No identifiable competitors were found because "
            "no sufficiently reliable local business record "
            "was available for this village. This does NOT "
            "mean that no competitors exist in reality. "
            "Informal or unlisted businesses may be missing."
        ),
        lastUpdated=None,
        identifiable=False,
        estimated=False,
        source="data_unavailable",
        coverage="no_matching_village_record",
    )