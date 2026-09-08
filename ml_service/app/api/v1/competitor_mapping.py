"""
Module 3 — Competitor Mapping.

Phase 5:
Competition is calculated from category-specific identifiable
business evidence.

Total business density is NEVER used as a substitute for
category-specific competitor count.
"""

from typing import Optional

from fastapi import APIRouter

from app.data_access.villages import find_village
from app.data.competitor_evidence import (
    build_competitor_evidence,
    normalize_category,
)
from app.schemas.models import (
    CompetitorMappingRequest,
    CompetitorMappingResponse,
)


router = APIRouter()


def classify(
    count: Optional[int],
) -> str:
    """
    Classify only an identifiable category-specific count.

    None means the competition evidence is unavailable.
    It must never be converted into zero.
    """

    if count is None:
        return "data_unavailable"

    if count < 0:
        return "data_unavailable"

    if count <= 3:
        return "under_served"

    if count <= 7:
        return "moderately_competitive"

    return "highly_saturated"


@router.post(
    "/competitor-mapping",
    response_model=CompetitorMappingResponse,
)
def competitor_mapping(
    request: CompetitorMappingRequest,
):
    """
    Return category-specific competitor evidence
    for the requested location.
    """

    geo = request.geoContext

    # ------------------------------------------------------------------
    # Resolve the exact location.
    #
    # Never match using village name alone.
    # ------------------------------------------------------------------

    record = find_village(
        village=geo.village or "",
        block=geo.block,
        district=geo.district,
        state=geo.state,
    )

    # ------------------------------------------------------------------
    # Build competition evidence.
    #
    # This function performs:
    #   - category normalization
    #   - category filtering
    #   - deduplication
    #   - radius validation
    #   - confidence assignment
    # ------------------------------------------------------------------

    evidence = build_competitor_evidence(
        location_record=record,
        business_category=request.businessCategory,
        radius_km=geo.radiusKm,
    )

    count = evidence.get("count")

    classification = classify(count)

    return CompetitorMappingResponse(
        count=count,

        classification=classification,

        points=evidence.get(
            "points",
            [],
        ),

        identifiable=evidence.get(
            "identifiable",
            False,
        ),

        category=normalize_category(
            request.businessCategory
        ),

        radiusKm=geo.radiusKm,

        source=evidence.get(
            "source"
        ),

        sourceTier=evidence.get(
            "sourceTier"
        ),

        dataYear=evidence.get(
            "dataYear"
        ),

        coverage=evidence.get(
            "coverage",
            "unknown",
        ),

        geographicMatch=evidence.get(
            "geographicMatch",
            "unknown",
        ),

        confidence=evidence.get(
            "confidence",
            "low",
        ),

        radiusValidated=evidence.get(
            "radiusValidated",
            False,
        ),

        deduplicatedCount=evidence.get(
            "deduplicated",
            0,
        ),

        dataConfidenceNote=evidence.get(
            "dataConfidenceNote",
            (
                "Competition reflects identifiable "
                "businesses found using available data. "
                "Informal or unlisted businesses may not "
                "be captured."
            ),
        ),

        lastUpdated=evidence.get(
            "lastUpdated"
        ),
    )