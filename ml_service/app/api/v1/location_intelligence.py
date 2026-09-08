"""
UdyamSaarthi-AI — Module 1: Location Intelligence

Phase 3 responsibilities:
- Match the requested village to available evidence.
- Return location intelligence with provenance.
- Preserve source, coverage and confidence.
- Never fabricate population/business counts.
- Never interpret unavailable data as factual zero activity.
"""

from fastapi import APIRouter

from app.data_access.villages import find_village
from app.data.evidence_loader import build_village_evidence
from app.schemas.models import (
    GeoContext,
    Location,
    DataProvenance,
)


router = APIRouter()


# ---------------------------------------------------------------------------
# Fallback
# ---------------------------------------------------------------------------

def _build_fallback(location: Location) -> GeoContext:
    """
    Conservative fallback.

    Zero values mean "unavailable", not "zero consumers/businesses".
    """

    provenance = DataProvenance(
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
            "No sufficiently reliable local dataset record was found. "
            "Values are intentionally not fabricated."
        ),
    )

    return GeoContext(
        village=location.village,
        block=location.block,
        district=location.district,
        state=location.state,

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

        provenance=provenance,
        evidence={},

        dataLimitations=[
            "No exact village-level evidence was found in the currently loaded dataset.",
            "Consumer base is unavailable rather than assumed.",
            "Business density is unavailable rather than interpreted as zero competitors.",
            "Informal and unlisted businesses may not be captured.",
            "Government/local data coverage should be improved before treating this location as high confidence.",
        ],

        dataAvailabilityNote=(
            "No sufficiently reliable local record is currently available "
            "for this village. Zero values represent unavailable data, "
            "not zero population or zero businesses."
        ),

        isExactLocationMatch=False,
    )


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

@router.post(
    "/location-intelligence",
    response_model=GeoContext,
)
def location_intelligence(location: Location) -> GeoContext:

    record = find_village(
        village=location.village,
        block=location.block,
        district=location.district,
        state=location.state,
    )

    if not record:
        return _build_fallback(location)

    evidence = build_village_evidence(record)

    # ---------------------------------------------------------------
    # Limitations
    # ---------------------------------------------------------------

    limitations = []

    coverage = record.get("coverage", "unknown")

    if coverage != "complete":
        limitations.append(
            "The source does not necessarily cover every household or business."
        )

    source = (
        record.get("source")
        or record.get("dataSource")
        or "unknown"
    )

    if source == "seed_demo_v1" or source.startswith("seed_demo_v1"):
        limitations.append(
            "This record is demonstration data and is not verified "
            "government/local evidence."
        )

    data_year = record.get("dataYear")

    if data_year and data_year < 2026:
        limitations.append(
            f"Some underlying information is from {data_year} and should "
            "not be interpreted as current population/business reality."
        )

    data_notes = (
        record.get("dataNotes")
        or record.get("dataNote")
    )

    if data_notes:
        limitations.append(str(data_notes))

    # Remove duplicate limitations while preserving order.
    limitations = list(dict.fromkeys(limitations))

    # ---------------------------------------------------------------
    # Provenance
    # ---------------------------------------------------------------

    provenance = DataProvenance(
        source=source,

        sourceType=(
            record.get("sourceType")
            or (
                "assumption"
                if source == "seed_demo_v1"
                else "local_dataset"
            )
        ),

        authority=record.get(
            "authority",
            "unknown",
        ),

        dataYear=data_year,

        lastUpdated=record.get(
            "lastUpdated"
        ),

        geographicPrecision=record.get(
            "geographicPrecision",
            "village",
        ),

        coverage=coverage,

        completeness=record.get(
            "completeness",
            "unknown",
        ),

        estimated=bool(
            record.get(
                "estimated",
                source == "seed_demo_v1",
            )
        ),

        note=data_notes,
    )

    # ---------------------------------------------------------------
    # Confidence
    # ---------------------------------------------------------------

    data_confidence = record.get(
        "dataConfidence",
        "low",
    )

    if data_confidence not in {
        "low",
        "medium",
        "high",
    }:
        data_confidence = "low"

    # ---------------------------------------------------------------
    # Location match
    # ---------------------------------------------------------------

    exact_match = (
        str(record.get("village", "")).strip().lower()
        == location.village.strip().lower()
        and
        str(record.get("district", "")).strip().lower()
        == location.district.strip().lower()
    )

    # ---------------------------------------------------------------
    # Return
    # ---------------------------------------------------------------

    return GeoContext(
        village=record.get(
            "village",
            location.village,
        ),

        block=record.get(
            "block",
            location.block,
        ),

        district=record.get(
            "district",
            location.district,
        ),

        state=record.get(
            "state",
            location.state,
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

        existingBusinessDensity=max(
            0,
            int(
                record.get(
                    "existingBusinessDensity",
                    len(
                        record.get(
                            "existingBusinesses",
                            [],
                        )
                    ),
                )
            ),
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

        radiusKm=max(
            1,
            int(
                record.get(
                    "radiusKm",
                    8,
                )
            ),
        ),

        dataConfidence=data_confidence,

        dataSource=source,

        lastUpdated=record.get(
            "lastUpdated"
        ),

        provenance=provenance,

        evidence=evidence,

        dataLimitations=limitations,

        dataAvailabilityNote=(
            data_notes
            or
            "Figures reflect the available dataset and may not capture "
            "informal or unlisted businesses."
        ),

        isExactLocationMatch=exact_match,
    )