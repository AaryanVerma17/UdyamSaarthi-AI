"""
UdyamSaarthi-AI — Location Evidence Resolver.

Phase 4:
- Resolves a village using hierarchical geographic matching.
- Uses village + district + state, with block when available.
- Preserves evidence/provenance metadata.
- Does not fabricate missing location metrics.
- Keeps demo data explicitly marked as assumption data.
- Provides a stable interface for location_intelligence.py.
"""

from typing import Any, Dict, Optional

from app.data_access.villages import find_village


# ---------------------------------------------------------------------------
# Metrics exposed to downstream location intelligence
# ---------------------------------------------------------------------------

LOCATION_METRICS = (
    "consumerBase",
    "purchasingPowerIndex",
    "existingBusinessDensity",
    "livestockIndex",
    "marketsAndHaats",
    "distributionChannels",
)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _build_metric(
    record: Dict[str, Any],
    field: str,
) -> Dict[str, Any]:
    """
    Convert a raw village record field into a normalized metric object.

    The metric keeps all relevant provenance information so that the
    evidence layer can calculate/represent confidence later.
    """

    source = record.get(
        "source",
        "unknown",
    )

    source_type = record.get(
        "sourceType",
        "unknown",
    )

    source_tier = record.get(
        "sourceTier",
        "assumption",
    )

    return {
        "value": record.get(field),

        "source": source,
        "sourceKey": source,

        "sourceTier": source_tier,
        "sourceType": source_type,

        "authority": record.get(
            "authority",
            "unknown",
        ),

        "authorityScore": record.get(
            "authorityScore",
        ),

        "dataYear": record.get(
            "dataYear"
        ),

        "lastUpdated": record.get(
            "lastUpdated"
        ),

        "dataConfidence": record.get(
            "dataConfidence",
            "low",
        ),

        "geographicMatch": record.get(
            "geographicMatch",
            "exact",
        ),

        "geographicPrecision": record.get(
            "geographicPrecision",
            "village",
        ),

        "coverage": record.get(
            "coverage",
            "partial",
        ),

        "completeness": record.get(
            "completeness",
            "partial",
        ),

        "estimated": bool(
            record.get(
                "estimated",
                False,
            )
        ),

        "isAssumption": bool(
            record.get(
                "isAssumption",
                source_tier == "assumption",
            )
        ),

        "dataNotes": record.get(
            "dataNotes"
        ),
    }


def _build_result(
    location: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Build a standard resolver response.
    """

    return {
        "location": location,
        "sources": [],
        "metrics": {},
        "limitations": [],
        "exactMatch": False,

        # Phase 4 government-data fields.
        "registeredBusinessCount": None,
        "informalBusinessEstimateAvailable": False,
    }


# ---------------------------------------------------------------------------
# Main resolver
# ---------------------------------------------------------------------------

def resolve_location(
    *,
    village: str,
    block: Optional[str],
    district: str,
    state: Optional[str],
) -> Dict[str, Any]:
    """
    Resolve location-specific evidence.

    Matching is performed by villages.find_village():

        1. village + block + district + state
        2. village + district + state

    Village name alone is never sufficient.

    Returns a normalized structure consumed by
    location_intelligence.py.
    """

    location = {
        "village": village,
        "block": block,
        "district": district,
        "state": state,
    }

    result = _build_result(location)

    # -----------------------------------------------------------------------
    # Resolve exact village
    # -----------------------------------------------------------------------

    village_record = find_village(
        village=village,
        block=block,
        district=district,
        state=state,
    )

    # -----------------------------------------------------------------------
    # No exact record
    # -----------------------------------------------------------------------

    if not village_record:
        result["limitations"].extend(
            [
                "No exact village record was found in the loaded evidence datasets.",
                "Consumer base is unavailable rather than assumed.",
                "Business density is unavailable rather than interpreted as zero competitors.",
                "Informal and unlisted businesses may not be captured.",
                "Government/local data coverage should be improved before treating this location as high confidence.",
            ]
        )

        return result

    # -----------------------------------------------------------------------
    # Exact record found
    # -----------------------------------------------------------------------

    result["exactMatch"] = True

    source = village_record.get(
        "source",
        "unknown",
    )

    result["sources"].append(
        source
    )

    # -----------------------------------------------------------------------
    # Build normalized metrics
    # -----------------------------------------------------------------------

    for field in LOCATION_METRICS:

        if field not in village_record:
            continue

        # Do not create fake metrics for absent values.
        if village_record[field] is None:
            continue

        result["metrics"][field] = _build_metric(
            village_record,
            field,
        )

    # -----------------------------------------------------------------------
    # Registered business count
    #
    # This is deliberately NOT inferred from existingBusinessDensity.
    # A future Udyam adapter can populate this.
    # -----------------------------------------------------------------------

    if (
        village_record.get(
            "registeredBusinessCount"
        )
        is not None
    ):
        result["registeredBusinessCount"] = (
            village_record.get(
                "registeredBusinessCount"
            )
        )

    # -----------------------------------------------------------------------
    # Informal-sector availability
    # -----------------------------------------------------------------------

    result[
        "informalBusinessEstimateAvailable"
    ] = bool(
        village_record.get(
            "informalBusinessEstimateAvailable",
            False,
        )
    )

    # -----------------------------------------------------------------------
    # Data-quality limitations
    # -----------------------------------------------------------------------

    coverage = village_record.get(
        "coverage",
        "partial",
    )

    if coverage != "complete":
        result["limitations"].append(
            "The source does not necessarily cover every "
            "household or business."
        )

    # -----------------------------------------------------------------------
    # Demo-data warning
    # -----------------------------------------------------------------------

    if source == "seed_demo_v1":
        result["limitations"].append(
            "This record is demonstration data and is not "
            "verified government/local evidence."
        )

    # -----------------------------------------------------------------------
    # Historical-data warning
    # -----------------------------------------------------------------------

    data_year = village_record.get(
        "dataYear"
    )

    if (
        isinstance(data_year, int)
        and data_year < 2026
        and not village_record.get(
            "estimated",
            False,
        )
    ):
        result["limitations"].append(
            f"Some underlying information is from "
            f"{data_year} and should not be interpreted "
            "as current population/business reality."
        )

    # -----------------------------------------------------------------------
    # Explicit data notes
    # -----------------------------------------------------------------------

    data_notes = village_record.get(
        "dataNotes"
    )

    if data_notes:
        result["limitations"].append(
            str(data_notes)
        )

    return result