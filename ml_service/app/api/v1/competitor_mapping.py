"""
Module 3 — Competitor Mapping

Real implementation: looks up the village's actual geo-tagged business
listings via app/data_access/villages.py, filters to the requested
business category, and classifies market saturation by count.

Falls back to the density figure already computed in Module 1 (with no
exact points) when the village isn't in the ingested dataset yet — this
is the "identifiable competitors found" distinction from the team's
ground-reality discussion: we never claim precise point locations the
underlying data doesn't actually support.
"""
from fastapi import APIRouter
from app.schemas.models import CompetitorMappingRequest, CompetitorMappingResponse, CompetitorPoint
from app.data_access.villages import find_village

router = APIRouter()


def classify(count: int) -> str:
    if count <= 3:
        return "under_served"
    if count <= 7:
        return "moderately_competitive"
    return "highly_saturated"


@router.post("/competitor-mapping", response_model=CompetitorMappingResponse)
def map_competitors(payload: CompetitorMappingRequest):
    village_record = find_village(payload.geoContext.village) if payload.geoContext.village else None

    if village_record:
        matching = [
            b for b in village_record.get("existingBusinesses", [])
            if b["category"].lower() == payload.businessCategory.lower()
        ]
        count = len(matching)
        points = [
            CompetitorPoint(lat=b["lat"], lng=b["lng"], name=b["name"], category=b["category"])
            for b in matching
        ]
        return CompetitorMappingResponse(
            count=count,
            classification=classify(count),
            points=points,
            lastUpdated=village_record.get("lastUpdated"),
        )

    # No exact record — fall back to Module 1's density estimate, no fabricated points
    count = payload.geoContext.existingBusinessDensity
    return CompetitorMappingResponse(count=count, classification=classify(count), points=[], lastUpdated=None)
