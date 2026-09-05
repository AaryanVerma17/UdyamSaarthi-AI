"""
Module 1 — Hyper-Local Business Intelligence

Reads from ml_service/app/data/villages.json (built by
scripts/data_ingestion/ingest.py). Falls back to a deterministic
seeded-mock estimate for any village not yet in the dataset, so the
pipeline never breaks while real data coverage is still growing — but
the response always says which path was used via dataConfidence and
dataSource, per the team's ground-reality/data-confidence decision.

The village name is carried forward on GeoContext.village so downstream
modules (competitor mapping, pricing) can look up the same raw record
without re-parsing the request.
"""
import json
from pathlib import Path
from fastapi import APIRouter
from app.schemas.models import Location, GeoContext

router = APIRouter()

DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "villages.json"


def _load_dataset() -> dict:
    if DATA_PATH.exists():
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"villages": []}


def _find_village(dataset: dict, location: Location):
    for v in dataset.get("villages", []):
        if v["village"].strip().lower() == location.village.strip().lower():
            return v
    return None


def _fallback_estimate(location: Location) -> GeoContext:
    seed = sum(ord(c) for c in location.village) % 5
    return GeoContext(
        village=location.village,
        consumerBase=3500 + seed * 300,
        purchasingPowerIndex=["low", "low-medium", "medium", "medium-high", "high"][seed],
        existingBusinessDensity=4 + seed,
        marketsAndHaats=["Weekly Haat (estimated)"],
        distributionChannels=["local haat", "direct retail"],
        livestockIndex=["low", "low", "medium", "high", "high"][seed],
        radiusKm=8,
        dataConfidence="low",
        dataSource="fallback_estimate_v1 (no ingested record for this village — see scripts/data_ingestion/)",
        lastUpdated=None,
    )


@router.post("/location-intelligence", response_model=GeoContext)
def get_location_intelligence(location: Location):
    dataset = _load_dataset()
    record = _find_village(dataset, location)

    if record is None:
        return _fallback_estimate(location)

    return GeoContext(
        village=record["village"],
        consumerBase=record["consumerBase"],
        purchasingPowerIndex=record["purchasingPowerIndex"],
        existingBusinessDensity=len(record.get("existingBusinesses", [])),
        marketsAndHaats=record.get("marketsAndHaats", []),
        distributionChannels=record.get("distributionChannels", []),
        livestockIndex=record["livestockIndex"],
        radiusKm=8,
        dataConfidence=record.get("dataConfidence", "medium"),
        dataSource=record.get("dataSource", "seed_demo_v1"),
        lastUpdated=record.get("lastUpdated"),
    )
