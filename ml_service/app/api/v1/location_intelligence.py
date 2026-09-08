"""
Module 1 — Dynamic Location Intelligence.

Phase 4 responsibility:

- Resolve the requested village using hierarchical matching.
- Return the strongest available evidence.
- Preserve source, year, freshness, geography and coverage.
- Explicitly distinguish observed data from estimates.
- Never convert missing evidence into fabricated zeros.
- Never fabricate Census 2027 values.
"""

from typing import Any, Dict

from fastapi import APIRouter

from app.data.evidence import build_evidence
from app.data.location_resolver import resolve_location
from app.schemas.models import (
    GeoContext,
    Location,
)


router = APIRouter()


def _overall_confidence(
    evidence: Dict[str, Dict[str, Any]],
) -> str:
    """
    Determine conservative overall confidence.

    Rules:

    - no evidence -> low
    - any low evidence -> low
    - otherwise any medium -> medium
    - otherwise high
    """

    if not evidence:
        return "low"

    values = [
        item.get(
            "confidence",
            "low",
        )
        for item in evidence.values()
    ]

    if "low" in values:
        return "low"

    if "medium" in values:
        return "medium"

    if "high" in values:
        return "high"

    return "low"


def _metric_value(
    metrics: Dict[str, Dict[str, Any]],
    name: str,
    default: Any = None,
) -> Any:
    """
    Safely extract a metric value.
    """

    metric = metrics.get(name)

    if not isinstance(metric, dict):
        return default

    return metric.get(
        "value",
        default,
    )


def _metric_metadata(
    metrics: Dict[str, Dict[str, Any]],
    name: str,
) -> Dict[str, Any]:
    """
    Safely retrieve metric metadata.
    """

    metric = metrics.get(name)

    if isinstance(metric, dict):
        return metric

    return {}


@router.post(
    "/location-intelligence",
    response_model=GeoContext,
)
def location_intelligence(
    location: Location,
) -> GeoContext:

    # ----------------------------------------------------------
    # Resolve location
    # ----------------------------------------------------------

    resolved = resolve_location(
        village=location.village,
        block=location.block,
        district=location.district,
        state=location.state,
    )

    metrics = resolved.get(
        "metrics",
        {},
    )

    limitations = list(
        resolved.get(
            "limitations",
            [],
        )
    )

    # ----------------------------------------------------------
    # Build metric-level evidence.
    #
    # Phase 3's evidence layer remains the source of
    # confidence/provenance normalization.
    # ----------------------------------------------------------

    evidence: Dict[str, Dict[str, Any]] = {}

    for metric_name, metric in metrics.items():

        source = metric.get(
            "source",
            "estimated",
        )

        evidence[metric_name] = build_evidence(
            metric=metric_name,

            value=metric.get(
                "value"
            ),

            source=source,

            last_updated=metric.get(
                "lastUpdated"
            ),

            data_year=metric.get(
                "dataYear"
            ),

            geographic_match=metric.get(
                "geographicMatch",
                "unknown",
            ),

            coverage=metric.get(
                "coverage",
                "unknown",
            ),

            notes=metric.get(
                "dataNotes"
            ),
        )

        # Preserve estimate/assumption state
        # from the resolved record where available.

        evidence[metric_name][
            "isAssumption"
        ] = bool(
            metric.get(
                "isAssumption",
                evidence[metric_name].get(
                    "isAssumption",
                    False,
                ),
            )
        )

    # ----------------------------------------------------------
    # Overall confidence
    # ----------------------------------------------------------

    confidence = _overall_confidence(
        evidence
    )

    # ----------------------------------------------------------
    # Core metrics
    # ----------------------------------------------------------

    consumer_metric = _metric_metadata(
        metrics,
        "consumerBase",
    )

    consumer_base = _metric_value(
        metrics,
        "consumerBase",
        None,
    )

    business_density = _metric_value(
        metrics,
        "existingBusinessDensity",
        None,
    )

    livestock_index = _metric_value(
        metrics,
        "livestockIndex",
        "unknown",
    )

    purchasing_power = _metric_value(
        metrics,
        "purchasingPowerIndex",
        "unknown",
    )

    markets = _metric_value(
        metrics,
        "marketsAndHaats",
        [],
    )

    channels = _metric_value(
        metrics,
        "distributionChannels",
        [],
    )

    # ----------------------------------------------------------
    # Population metadata
    # ----------------------------------------------------------

    population_year = consumer_metric.get(
        "dataYear"
    )

    population_is_estimate = bool(
        consumer_metric.get(
            "estimated",
            consumer_metric.get(
                "isAssumption",
                False,
            ),
        )
    )

    # ----------------------------------------------------------
    # Government-data availability
    #
    # This means government-origin evidence exists.
    # It does NOT mean every metric is government data.
    # ----------------------------------------------------------

    government_sources = {
        "census",
        "udyam",
        "asuse",
        "government",
        "government_market",
    }

    government_data_available = any(
        str(
            item.get(
                "sourceKey",
                item.get(
                    "source",
                    "",
                ),
            )
        ).lower()
        in government_sources
        for item in evidence.values()
    )

    # ----------------------------------------------------------
    # Registered business count
    #
    # This can come from a future Udyam provider.
    # Do not infer it from existingBusinessDensity.
    # ----------------------------------------------------------

    registered_business_count = resolved.get(
        "registeredBusinessCount"
    )

    # ----------------------------------------------------------
    # Informal-sector availability
    # ----------------------------------------------------------

    informal_business_estimate_available = bool(
        resolved.get(
            "informalBusinessEstimateAvailable",
            False,
        )
    )

    # ----------------------------------------------------------
    # Sources
    # ----------------------------------------------------------

    sources = list(
        dict.fromkeys(
            str(
                item.get(
                    "source",
                    "unknown",
                )
            )
            for item in evidence.values()
            if item.get(
                "source"
            )
        )
    )

    if not sources:
        sources = list(
            dict.fromkeys(
                str(source)
                for source in resolved.get(
                    "sources",
                    []
                )
                if source
            )
        )

    # ----------------------------------------------------------
    # Last updated
    # ----------------------------------------------------------

    updated_values = [
        item.get("lastUpdated")
        for item in metrics.values()
        if item.get("lastUpdated")
    ]

    last_updated = (
        max(updated_values)
        if updated_values
        else None
    )

    # ----------------------------------------------------------
    # Explicit limitations
    # ----------------------------------------------------------

    if not resolved.get(
        "exactMatch",
        False,
    ):
        if not limitations:
            limitations.append(
                "No exact village-level evidence "
                "was found in the currently loaded "
                "location datasets."
            )

    if (
        consumer_base is None
        and "Consumer base is unavailable rather than assumed."
        not in limitations
    ):
        limitations.append(
            "Consumer base is unavailable rather than assumed."
        )

    if (
        business_density is None
        and "Business density is unavailable rather than interpreted as zero competitors."
        not in limitations
    ):
        limitations.append(
            "Business density is unavailable rather than "
            "interpreted as zero competitors."
        )

    # ----------------------------------------------------------
    # Demonstration-data warning
    # ----------------------------------------------------------

    if any(
        str(
            item.get(
                "source",
                ""
            )
        ).lower()
        == "seed_demo_v1"
        for item in metrics.values()
    ):
        limitations.append(
            "This record is demonstration data and "
            "is not verified government/local evidence."
        )

    # ----------------------------------------------------------
    # Historical data warning
    # ----------------------------------------------------------

    if (
        population_year is not None
        and population_year < 2026
        and not population_is_estimate
    ):
        limitations.append(
            f"Population evidence is from {population_year}. "
            "It is an observed historical value and should "
            "not be interpreted as a current population count."
        )

    # ----------------------------------------------------------
    # Return
    # ----------------------------------------------------------

    return GeoContext(
        village=location.village,
        block=location.block,
        district=location.district,
        state=location.state,

        consumerBase=consumer_base,

        purchasingPowerIndex=purchasing_power,

        existingBusinessDensity=business_density,

        marketsAndHaats=(
            markets
            if isinstance(
                markets,
                list,
            )
            else []
        ),

        distributionChannels=(
            channels
            if isinstance(
                channels,
                list,
            )
            else []
        ),

        livestockIndex=livestock_index,

        radiusKm=8,

        dataConfidence=confidence,

        dataSource=(
            sources[0]
            if len(sources) == 1
            else (
                "multiple_sources"
                if sources
                else "estimated"
            )
        ),

        lastUpdated=last_updated,

        evidence=evidence,

        dataLimitations=list(
            dict.fromkeys(
                limitations
            )
        ),

        isExactLocationMatch=bool(
            resolved.get(
                "exactMatch",
                False,
            )
        ),

        populationYear=population_year,

        populationIsEstimate=(
            population_is_estimate
        ),

        governmentDataAvailable=(
            government_data_available
        ),

        registeredBusinessCount=(
            registered_business_count
        ),

        informalBusinessEstimateAvailable=(
            informal_business_estimate_available
        ),
    )