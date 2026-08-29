"""
Module 1 — Hyper-Local Business Intelligence
Currently returns deterministic mock data shaped like a real Census/OSM/mandi
aggregation. Replace the body of `get_location_intelligence` with real data
lookups (Census 2027 where available, falling back to Census 2011 + other
government datasets, per the team's data-source-hierarchy decision) without
changing the response contract below.
"""
from fastapi import APIRouter
from app.schemas.models import Location, GeoContext

router = APIRouter()


@router.post("/location-intelligence", response_model=GeoContext)
def get_location_intelligence(location: Location):
    # TODO(team): replace with real ingestion pipeline (scripts/data_ingestion/)
    # combining Census 2027 (where published) + Census 2011 + agri/mandi data.
    # Track dataConfidence and dataSource per the team's meeting action items.
    seed = sum(ord(c) for c in location.village) % 5
    return GeoContext(
        consumerBase=3500 + seed * 300,
        purchasingPowerIndex=["low", "low-medium", "medium", "medium-high", "high"][seed],
        existingBusinessDensity=4 + seed,
        marketsAndHaats=["Weekly Haat", "Block Market"],
        distributionChannels=["local haat", "cooperative society", "direct retail"],
        livestockIndex=["low", "low", "medium", "high", "high"][seed],
        radiusKm=8,
        dataConfidence="medium",
        dataSource="mock_v1 (replace with Census 2027/2011 + mandi data pipeline)",
    )
