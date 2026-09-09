"""
Module 2 — Business Viability Engine
Phase 5-compatible deterministic baseline.

Purpose:
    Evaluate the requested business using:
        - local consumer base
        - purchasing power
        - livestock activity
        - category-specific competition
        - evidence confidence

Important:
    This is NOT an ML-trained profitability model.

    Business-type scores are temporary model priors.
    Missing evidence must never be converted into fake certainty.
    Missing competition is NOT treated as zero competition.
    Cash flow and break-even are NOT fabricated.
"""

from typing import Any, Optional

from fastapi import APIRouter

from app.schemas.models import (
    ViabilityRequest,
    ViabilityResponse,
)

from app.data_access.villages import find_village


router = APIRouter()


# ---------------------------------------------------------------------------
# Temporary business priors
# ---------------------------------------------------------------------------
#
# These are deterministic development baselines.
# They are NOT factual profitability claims.
#
# Future phases should replace these with evidence-backed
# business economics and historical outcome data.
# ---------------------------------------------------------------------------

BUSINESS_BASE_SCORE = {
    "Dairy": 55,
    "Kirana": 50,
    "Tailoring": 52,
    "Food Processing": 54,
    "Repair Shop": 50,
}


# ---------------------------------------------------------------------------
# Purchasing power adjustments
# ---------------------------------------------------------------------------

PURCHASING_POWER_SCORE = {
    "low": -8,
    "low-medium": -3,
    "medium": 0,
    "medium-high": 5,
    "high": 10,
    "unknown": 0,
}


# ---------------------------------------------------------------------------
# Business categories where livestock activity is relevant
# ---------------------------------------------------------------------------

LIVESTOCK_RELEVANCE = {
    "Dairy": True,
    "Food Processing": True,
}


# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

def _safe_number(
    value: Any,
    default: Optional[float] = None,
) -> Optional[float]:
    """
    Safely convert a value to a finite number.
    """
    try:
        if value is None:
            return default

        number = float(value)

        if number != number:
            return default

        return number

    except (TypeError, ValueError):
        return default


def _get_attr(
    obj: Any,
    name: str,
    default: Any = None,
) -> Any:
    """
    Read a field from either:
        - a Pydantic model
        - a dictionary
    """
    if obj is None:
        return default

    if isinstance(obj, dict):
        return obj.get(name, default)

    return getattr(obj, name, default)


def _normalise_category(
    category: Optional[str],
) -> str:
    """
    Normalize business category for comparisons.
    """
    if category is None:
        return ""

    return str(category).strip().lower()


# ---------------------------------------------------------------------------
# Location evidence
# ---------------------------------------------------------------------------

def _has_location_evidence(
    geo_context: Any,
) -> bool:
    """
    Determine whether at least one useful location signal exists.

    Missing observations are NOT interpreted as zero activity.
    """

    consumer_base = _safe_number(
        _get_attr(
            geo_context,
            "consumerBase",
            0,
        ),
        0,
    )

    purchasing_power = _get_attr(
        geo_context,
        "purchasingPowerIndex",
        "unknown",
    )

    livestock = _get_attr(
        geo_context,
        "livestockIndex",
        "unknown",
    )

    markets = _get_attr(
        geo_context,
        "marketsAndHaats",
        [],
    )

    channels = _get_attr(
        geo_context,
        "distributionChannels",
        [],
    )

    return bool(
        (consumer_base or 0) > 0
        or purchasing_power != "unknown"
        or livestock != "unknown"
        or bool(markets)
        or bool(channels)
    )


# ---------------------------------------------------------------------------
# Category-specific competition
# ---------------------------------------------------------------------------

def _category_competitor_count(
    geo_context: Any,
    business_category: str,
) -> Optional[int]:
    """
    Return the number of identifiable businesses matching the requested
    category in the available village evidence.

    IMPORTANT:
        None means competition evidence is unavailable.

        None does NOT mean zero competitors.
    """

    village = _get_attr(
        geo_context,
        "village",
    )

    if not village:
        return None

    try:
        village_record = find_village(village)

    except TypeError:
        # Compatibility with future find_village implementations
        # requiring additional location arguments.
        try:
            village_record = find_village(
                village=village,
                block=_get_attr(geo_context, "block"),
                district=_get_attr(geo_context, "district"),
                state=_get_attr(geo_context, "state"),
            )
        except Exception:
            village_record = None

    except Exception:
        village_record = None

    if not village_record:
        return None

    businesses = village_record.get(
        "existingBusinesses",
        [],
    )

    if not isinstance(businesses, list):
        return None

    target_category = _normalise_category(
        business_category
    )

    count = 0

    for business in businesses:
        if not isinstance(business, dict):
            continue

        category = _normalise_category(
            business.get("category")
        )

        if category == target_category:
            count += 1

    return count


def _get_competition_context(
    geo_context: Any,
    business_category: str,
) -> dict:
    """
    Build a Phase 5-compatible competition object.

    Available:
        count is an identifiable category-specific count.

    Unavailable:
        count = None
        available = False
        signal = 0.5

    The neutral 0.5 signal represents uncertainty.
    It does NOT imply low competition.
    """

    # Prefer the competition context injected by the controller.
    existing_context = _get_attr(
        geo_context,
        "competition",
        None,
    )

    if existing_context is not None:

        count = _get_attr(
            existing_context,
            "count",
            None,
        )

        identifiable = bool(
            _get_attr(
                existing_context,
                "identifiable",
                False,
            )
        )

        classification = _get_attr(
            existing_context,
            "classification",
            "data_unavailable",
        )

        confidence = _get_attr(
            existing_context,
            "confidence",
            "low",
        )

        source = _get_attr(
            existing_context,
            "source",
            None,
        )

        if count is not None and identifiable:

            try:
                count = int(count)
            except (TypeError, ValueError):
                count = None

            if count is not None and count >= 0:

                if count <= 3:
                    signal = 1.0
                elif count <= 7:
                    signal = 0.6
                else:
                    signal = 0.2

                return {
                    "available": True,
                    "count": count,
                    "classification": classification,
                    "confidence": confidence,
                    "signal": signal,
                    "source": source,
                }

    # ------------------------------------------------------------------
    # Compatibility fallback:
    #
    # If the controller has not injected competition yet, derive it
    # from the currently loaded village evidence.
    # ------------------------------------------------------------------

    count = _category_competitor_count(
        geo_context,
        business_category,
    )

    if count is None:

        return {
            "available": False,
            "count": None,
            "classification": "data_unavailable",
            "confidence": "low",
            "signal": 0.5,
            "source": None,
        }

    if count <= 3:
        signal = 1.0
        classification = "under_served"

    elif count <= 7:
        signal = 0.6
        classification = "moderately_competitive"

    else:
        signal = 0.2
        classification = "highly_saturated"

    return {
        "available": True,
        "count": count,
        "classification": classification,
        "confidence": _get_attr(
            geo_context,
            "dataConfidence",
            "low",
        ),
        "signal": signal,
        "source": _get_attr(
            geo_context,
            "dataSource",
            None,
        ),
    }


# ---------------------------------------------------------------------------
# Deterministic score
# ---------------------------------------------------------------------------

def compute_score(
    geo_context: Any,
    business_category: str,
) -> int:
    """
    Calculate the deterministic baseline viability score.

    This function is intentionally kept public because
    opportunity.py imports it directly.

    Score components:

        Business prior
        + purchasing power
        + livestock relevance
        + category-specific competition
        + consumer base
        + confidence adjustment

    Missing competition:
        neutral signal / no competition penalty

    Missing location evidence:
        cautious neutral score of 50
    """

    # --------------------------------------------------------------
    # No useful location evidence
    # --------------------------------------------------------------

    if not _has_location_evidence(
        geo_context
    ):
        return 50

    # --------------------------------------------------------------
    # Business base score
    # --------------------------------------------------------------

    score = BUSINESS_BASE_SCORE.get(
        business_category,
        50,
    )

    # --------------------------------------------------------------
    # Purchasing power
    # --------------------------------------------------------------

    purchasing_power = _get_attr(
        geo_context,
        "purchasingPowerIndex",
        "unknown",
    )

    score += PURCHASING_POWER_SCORE.get(
        purchasing_power,
        0,
    )

    # --------------------------------------------------------------
    # Livestock relevance
    # --------------------------------------------------------------

    livestock = _get_attr(
        geo_context,
        "livestockIndex",
        "unknown",
    )

    if (
        LIVESTOCK_RELEVANCE.get(
            business_category,
            False,
        )
        and livestock in ("medium", "high")
    ):

        score += (
            8
            if livestock == "high"
            else 4
        )

    # --------------------------------------------------------------
    # Competition
    # --------------------------------------------------------------

    competition = _get_competition_context(
        geo_context,
        business_category,
    )

    if competition["available"]:

        competitor_count = competition["count"]

        # Preserve the original Phase 0 scoring behavior:
        # 1 competitor = -3
        # 2 competitors = -6
        # ...
        # maximum competition penalty = -18
        score -= min(
            competitor_count * 3,
            18,
        )

    # IMPORTANT:
    #
    # If competition is unavailable:
    # DO NOT subtract anything.
    #
    # Missing competition is uncertainty, not low competition.

    # --------------------------------------------------------------
    # Consumer base
    # --------------------------------------------------------------

    consumer_base = _safe_number(
        _get_attr(
            geo_context,
            "consumerBase",
            0,
        ),
        0,
    )

    if consumer_base is not None:

        if consumer_base >= 5000:
            score += 6

        elif (
            consumer_base > 0
            and consumer_base < 2000
        ):
            score -= 6

    # --------------------------------------------------------------
    # Low-confidence evidence adjustment
    # --------------------------------------------------------------

    data_confidence = _get_attr(
        geo_context,
        "dataConfidence",
        "low",
    )

    if data_confidence == "low":

        score = round(
            score * 0.85
            + 50 * 0.15
        )

    # --------------------------------------------------------------
    # Clamp
    # --------------------------------------------------------------

    return max(
        0,
        min(
            100,
            round(score),
        ),
    )


# ---------------------------------------------------------------------------
# Explanation
# ---------------------------------------------------------------------------

def build_explanation(
    business_category: str,
    geo_context: Any,
    score: int,
    label: str,
) -> str:

    reasons = []

    livestock = _get_attr(
        geo_context,
        "livestockIndex",
        "unknown",
    )

    if (
        livestock in ("medium", "high")
        and LIVESTOCK_RELEVANCE.get(
            business_category,
            False,
        )
    ):

        reasons.append(
            f"{livestock} livestock activity"
        )

    purchasing_power = _get_attr(
        geo_context,
        "purchasingPowerIndex",
        "unknown",
    )

    if purchasing_power in (
        "medium-high",
        "high",
    ):

        reasons.append(
            "relatively stronger purchasing power"
        )

    # --------------------------------------------------------------
    # Phase 5 competition context
    # --------------------------------------------------------------

    competition = _get_competition_context(
        geo_context,
        business_category,
    )

    if competition["available"]:

        competitor_count = competition["count"]

        if competitor_count <= 3:

            reasons.append(
                "limited identifiable competition"
            )

        elif competitor_count > 7:

            reasons.append(
                "high identifiable competition"
            )

        else:

            reasons.append(
                "moderate identifiable competition"
            )

    else:

        reasons.append(
            "category-specific competition data is unavailable"
        )

    if not reasons:

        reasons.append(
            "limited available local evidence"
        )

    evidence_note = (
        " This is a preliminary baseline assessment, "
        "not a guaranteed business outcome."
    )

    return (
        f"{business_category} shows "
        f"{label.lower()} under the current "
        f"evidence available for this area, "
        f"driven by {', '.join(reasons)}."
        f"{evidence_note}"
    )


# ---------------------------------------------------------------------------
# Viability endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/viability",
    response_model=ViabilityResponse,
)
def score_viability(
    payload: ViabilityRequest,
):

    geo_context = payload.geoContext

    business_category = (
        payload.businessCategory
    )

    # --------------------------------------------------------------
    # Score
    # --------------------------------------------------------------

    score = compute_score(
        geo_context,
        business_category,
    )

    # --------------------------------------------------------------
    # Label
    # --------------------------------------------------------------

    label = (
        "High Potential"
        if score >= 75
        else (
            "Moderate Potential"
            if score >= 50
            else "Low Potential"
        )
    )

    # --------------------------------------------------------------
    # Explanation
    # --------------------------------------------------------------

    explanation = build_explanation(
        business_category,
        geo_context,
        score,
        label,
    )

    # --------------------------------------------------------------
    # Evidence availability
    # --------------------------------------------------------------

    has_evidence = _has_location_evidence(
        geo_context
    )

    competition = _get_competition_context(
        geo_context,
        business_category,
    )

    limitations = []

    # --------------------------------------------------------------
    # Location limitations
    # --------------------------------------------------------------

    if not has_evidence:

        limitations.append(
            "No reliable village-specific market "
            "record was available."
        )

    # --------------------------------------------------------------
    # Confidence limitations
    # --------------------------------------------------------------

    data_confidence = _get_attr(
        geo_context,
        "dataConfidence",
        "low",
    )

    if data_confidence == "low":

        limitations.append(
            "Available location evidence has "
            "low confidence."
        )

    # --------------------------------------------------------------
    # Competition limitation
    # --------------------------------------------------------------

    if not competition["available"]:

        limitations.append(
            "Category-specific competition data is "
            "unavailable. Informal or unlisted "
            "businesses may also be missing."
        )

    # --------------------------------------------------------------
    # Generic validation limitation
    # --------------------------------------------------------------

    if not limitations:

        limitations.append(
            "This is a deterministic baseline and "
            "should be validated against local "
            "operating costs and demand."
        )

    # --------------------------------------------------------------
    # Estimate status
    # --------------------------------------------------------------

    #
    # Your models.py supports:
    #
    # evidence_supported
    # partially_evidence_supported
    # preliminary
    # insufficient_data
    #
    # Phase 5 specifically recommends:
    #
    # competition available -> evidence_supported
    # competition unavailable -> partially_evidence_supported
    #

    if not has_evidence:

        estimate_status = (
            "insufficient_data"
        )

    elif competition["available"]:

        estimate_status = (
            "evidence_supported"
        )

    else:

        estimate_status = (
            "partially_evidence_supported"
        )

    # --------------------------------------------------------------
    # Drivers
    # --------------------------------------------------------------

    drivers = [
        "local_demand",
        "competition_density",
        "purchasing_power",
        "livestock_activity",
    ]

    if competition["available"]:

        drivers.append(
            f"{competition['count']} identifiable "
            f"{business_category} competitors were "
            "found using available data."
        )

    else:

        drivers.append(
            "Category-specific competition data is "
            "unavailable; the competition component "
            "is therefore uncertain."
        )

    # --------------------------------------------------------------
    # SWOT
    # --------------------------------------------------------------

    strengths = []

    if has_evidence:

        strengths.append(
            "Some local evidence supports "
            "the business opportunity."
        )

    if competition["available"]:

        if competition["count"] <= 3:

            strengths.append(
                "Available evidence indicates "
                "limited identifiable competition."
            )

    weaknesses = [
        "Detailed business-level operating "
        "economics are not yet available."
    ]

    if not competition["available"]:

        weaknesses.append(
            "Category-specific competition "
            "evidence is unavailable."
        )

    opportunities = [
        "Validate underserved customer needs locally."
    ]

    threats = [
        "Competition and input-price uncertainty."
    ]

    if not competition["available"]:

        threats.append(
            "Informal or unlisted competitors "
            "may not be captured."
        )

    # --------------------------------------------------------------
    # Response
    # --------------------------------------------------------------

    return ViabilityResponse(
        score=score,

        label=label,

        explanation=explanation,

        # Do NOT fabricate these.
        breakEvenMonths=None,

        expectedCashFlow=None,

        drivers=drivers,

        swot={
            "strengths": strengths,
            "weaknesses": weaknesses,
            "opportunities": opportunities,
            "threats": threats,
        },

        estimateStatus=estimate_status,

        dataLimitations=limitations,

        # Phase 5 compatibility
        signals={
            "competition": float(
                competition["signal"]
            ),
        },

        weights={
            "competition": 0.25,
            "purchasing_power": 0.25,
            "consumer_base": 0.25,
            "livestock_activity": 0.25,
        },

        limitations=limitations,

        competition={
            "available": competition["available"],
            "count": competition["count"],
            "classification": (
                competition["classification"]
            ),
            "confidence": (
                competition["confidence"]
            ),
            "signal": competition["signal"],
            "source": competition["source"],
        },

        # No fabricated business economics.
        businessEconomics={},
    )