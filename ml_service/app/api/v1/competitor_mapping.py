"""
Module 3 — Competitor Mapping
Mock geo-clustering today; swap for real DBSCAN clustering over geo-tagged
business listings (Kavya) without changing the response contract.
Per the team's meeting notes: counts are phrased as "identifiable competitors
found" rather than an absolute total, since informal businesses may be missed.
"""
import random
from fastapi import APIRouter
from app.schemas.models import CompetitorMappingRequest, CompetitorMappingResponse, CompetitorPoint

router = APIRouter()


@router.post("/competitor-mapping", response_model=CompetitorMappingResponse)
def map_competitors(payload: CompetitorMappingRequest):
    count = payload.geoContext.existingBusinessDensity

    if count <= 3:
        classification = "under_served"
    elif count <= 7:
        classification = "moderately_competitive"
    else:
        classification = "highly_saturated"

    # Mock points scattered around a placeholder centroid — replace with real geo data
    base_lat, base_lng = 26.85, 80.95
    points = [
        CompetitorPoint(
            lat=base_lat + random.uniform(-0.05, 0.05),
            lng=base_lng + random.uniform(-0.05, 0.05),
            name=f"{payload.businessCategory} Business {i + 1}",
            category=payload.businessCategory,
        )
        for i in range(count)
    ]

    return CompetitorMappingResponse(count=count, classification=classification, points=points)
