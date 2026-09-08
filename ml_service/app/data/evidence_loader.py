"""
Builds evidence metadata from an ingested village record.
"""

from typing import Any, Dict

from .evidence import build_evidence


def build_village_evidence(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert a village record into metric-level evidence.

    The record may contain only a subset of metrics.
    Missing metrics are simply omitted.
    """

    source = record.get("source", "estimated")
    last_updated = record.get("lastUpdated")
    data_year = record.get("dataYear")

    geographic_match = record.get(
        "geographicMatch",
        "exact",
    )

    coverage = record.get(
        "coverage",
        "known",
    )

    evidence = {}

    metric_fields = [
        "consumerBase",
        "purchasingPowerIndex",
        "existingBusinessDensity",
        "livestockIndex",
        "marketsAndHaats",
        "distributionChannels",
    ]

    for metric in metric_fields:

        if metric not in record:
            continue

        evidence[metric] = build_evidence(
            metric=metric,
            value=record[metric],
            source=source,
            last_updated=last_updated,
            data_year=data_year,
            geographic_match=geographic_match,
            coverage=coverage,
            notes=record.get("dataNotes"),
        )

    return evidence