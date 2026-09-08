"""
Module 1 — Hyper-Local Business Intelligence

PHASE 0:

A missing village record must NOT receive a fabricated deterministic
population, purchasing-power score, livestock score, or competitor count.

The old fallback generated pseudo-real numbers from the village name.
That created false precision.

Until government/local data is integrated, an uncovered village is returned
with explicit low-confidence / unavailable signals.

Later phases will populate these fields from:

Government data
→ verified local data
→ research/secondary data
→ transparent fallback assumptions
"""

import json
from pathlib import Path

from fastapi import APIRouter

from app.schemas.models import (
    Location,
    GeoContext,
    DataProvenance,
)


router = APIRouter()

DATA_PATH = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "villages.json"
)


def _load_dataset() -> dict:
    if not DATA_PATH.exists():
        return {"villages": []}

    try:
        with open(
            DATA_PATH,
            "r",
            encoding="utf-8",
        ) as file:
            return json.load(file)
    except (
        OSError,
        json.JSONDecodeError,
    ):
        return {"villages": []}


def _find_village(
    dataset: dict,
    location: Location,
):
    requested_village = (
        location.village.strip().lower()
    )

    requested_district = (
        location.district.strip().lower()
    )

    for record in dataset.get(
        "villages",
        [],
    ):
        village = record.get(
            "village",
            "",
        ).strip().lower()

        district = record.get(
            "district",
            "",
        ).strip().lower()

        if (
            village == requested_village
            and district == requested_district
        ):
            return record

    return None


def _fallback_context(
    location: Location,
) -> GeoContext:
    """
    Honest fallback.

    Zero here means "no identifiable value available",
    NOT "there are zero consumers/businesses".
    """

    return GeoContext(
        village=location.village,
        consumerBase=0,
        purchasingPowerIndex="unknown",
        existingBusinessDensity=0,
        marketsAndHaats=[],
        distributionChannels=[],
        livestockIndex="unknown",
        radiusKm=8,
        dataConfidence="low",
        dataSource="data_unavailable",
        lastUpdated=None,
        provenance=DataProvenance(
            source="No matching local record",
            sourceType="unavailable",
            authority="none",
            dataYear=None,
            lastUpdated=None,
            geographicPrecision="unknown",
            coverage="no_matching_village_record",
            completeness="unknown",
            estimated=False,
            note=(
                "No verified local dataset record was found. "
                "Values are intentionally not fabricated."
            ),
        ),
        dataAvailabilityNote=(
            "No sufficiently reliable local record is currently "
            "available for this village. Zero values represent "
            "unavailable data, not zero population or zero businesses."
        ),
    )


@router.post(
    "/location-intelligence",
    response_model=GeoContext,
)
def get_location_intelligence(
    location: Location,
):
    dataset = _load_dataset()

    record = _find_village(
        dataset,
        location,
    )

    if record is None:
        return _fallback_context(location)

    provenance = DataProvenance(
        source=record.get(
            "dataSource",
            dataset.get("_meta", {}).get(
                "source",
                "unknown",
            ),
        ),
        sourceType=record.get(
            "sourceType",
            "local_dataset",
        ),
        authority=record.get(
            "authority",
            "unknown",
        ),
        dataYear=record.get(
            "dataYear",
        ),
        lastUpdated=record.get(
            "lastUpdated",
        ),
        geographicPrecision=record.get(
            "geographicPrecision",
            "village",
        ),
        coverage=record.get(
            "coverage",
            "unknown",
        ),
        completeness=record.get(
            "completeness",
            "unknown",
        ),
        estimated=record.get(
            "estimated",
            False,
        ),
        note=record.get(
            "dataNote",
        ),
    )

    return GeoContext(
        village=record.get(
            "village",
        ),
        consumerBase=max(
            0,
            int(
                record.get(
                    "consumerBase",
                    0,
                )
            ),
        ),
        purchasingPowerIndex=record.get(
            "purchasingPowerIndex",
            "unknown",
        ),
        existingBusinessDensity=len(
            record.get(
                "existingBusinesses",
                [],
            )
        ),
        marketsAndHaats=record.get(
            "marketsAndHaats",
            [],
        ),
        distributionChannels=record.get(
            "distributionChannels",
            [],
        ),
        livestockIndex=record.get(
            "livestockIndex",
            "unknown",
        ),
        radiusKm=8,
        dataConfidence=record.get(
            "dataConfidence",
            "low",
        ),
        dataSource=record.get(
            "dataSource",
            "unknown",
        ),
        lastUpdated=record.get(
            "lastUpdated",
        ),
        provenance=provenance,
        dataAvailabilityNote=record.get(
            "dataNote",
            (
                "Figures reflect the available dataset and "
                "may not capture informal businesses."
            ),
        ),
    )