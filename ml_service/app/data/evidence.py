"""
Evidence primitives used throughout UdyamSaarthi-AI.

Every important number should eventually be traceable
to an Evidence object.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from .source_registry import ASSUMPTION, get_source_definition


def _parse_date(value: Optional[str]):
    if not value:
        return None

    try:
        normalized = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalized)

        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)

        return parsed

    except (TypeError, ValueError):
        return None


def freshness_score(last_updated: Optional[str]) -> int:
    """
    Score freshness independently from source authority.

    Missing/invalid dates receive the lowest score.
    """

    updated = _parse_date(last_updated)

    if updated is None:
        return 0

    now = datetime.now(timezone.utc)

    age_days = max(0, (now - updated).days)

    if age_days <= 30:
        return 100

    if age_days <= 90:
        return 90

    if age_days <= 180:
        return 75

    if age_days <= 365:
        return 55

    if age_days <= 730:
        return 35

    return 15


def calculate_confidence(
    source: str,
    last_updated: Optional[str],
    geographic_match: str = "exact",
    coverage: str = "known",
) -> str:
    """
    Combine:

    - source authority
    - freshness
    - geographic relevance
    - coverage

    Confidence is intentionally conservative.
    """

    source_definition = get_source_definition(source)

    authority = source_definition.authority_score
    freshness = freshness_score(last_updated)

    geography_scores = {
        "exact": 100,
        "district": 75,
        "state": 55,
        "unknown": 25,
    }

    coverage_scores = {
        "complete": 100,
        "known": 75,
        "partial": 55,
        "unknown": 25,
    }

    geography_score = geography_scores.get(
        geographic_match,
        geography_scores["unknown"],
    )

    coverage_score = coverage_scores.get(
        coverage,
        coverage_scores["unknown"],
    )

    score = (
        authority * 0.40
        + freshness * 0.25
        + geography_score * 0.20
        + coverage_score * 0.15
    )

    # Assumptions and model estimates can never become high
    # confidence merely because they are recent.
    if source_definition.tier == ASSUMPTION:
        return "low"

    if score >= 80:
        return "high"

    if score >= 60:
        return "medium"

    return "low"


def build_evidence(
    *,
    metric: str,
    value: Any,
    source: str,
    last_updated: Optional[str] = None,
    data_year: Optional[int] = None,
    geographic_match: str = "exact",
    coverage: str = "known",
    notes: Optional[str] = None,
) -> Dict[str, Any]:

    source_definition = get_source_definition(source)

    confidence = calculate_confidence(
        source=source,
        last_updated=last_updated,
        geographic_match=geographic_match,
        coverage=coverage,
    )

    return {
        "metric": metric,
        "value": value,
        "source": source_definition.name,
        "sourceKey": source,
        "sourceTier": source_definition.tier,
        "authorityScore": source_definition.authority_score,
        "dataYear": data_year,
        "lastUpdated": last_updated,
        "geographicMatch": geographic_match,
        "coverage": coverage,
        "confidence": confidence,
        "isAssumption": source_definition.tier == ASSUMPTION,
        "notes": notes,
    }