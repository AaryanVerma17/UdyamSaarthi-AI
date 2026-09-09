"""
UdyamSaarthi-AI
Phase 5 — Competitor Evidence Engine

Responsibilities
----------------
1. Normalize business categories.
2. Extract identifiable business records.
3. Deduplicate businesses across sources.
4. Filter by requested business category.
5. Validate geographic radius when coordinates exist.
6. Preserve source/provenance information.
7. Distinguish identifiable businesses from unavailable evidence.

Important
---------
An identifiable competitor count is NOT a census of all businesses.

If category-specific business evidence is unavailable:

    count = None
    identifiable = False

This must never become:

    count = 0
    classification = "under_served"
"""

from math import asin, cos, radians, sin, sqrt
from typing import Any, Dict, Iterable, List, Optional


# ---------------------------------------------------------------------------
# Category normalization
# ---------------------------------------------------------------------------

CATEGORY_ALIASES = {
    "dairy": "Dairy",
    "milk": "Dairy",
    "milk shop": "Dairy",
    "dairy farm": "Dairy",
    "dairy store": "Dairy",

    "kirana": "Kirana",
    "grocery": "Kirana",
    "grocery store": "Kirana",
    "general store": "Kirana",
    "provision store": "Kirana",

    "tailor": "Tailoring",
    "tailoring": "Tailoring",
    "tailoring shop": "Tailoring",

    "food processing": "Food Processing",
    "food processor": "Food Processing",
    "food manufacturing": "Food Processing",

    "repair": "Repair Shop",
    "repair shop": "Repair Shop",
    "mobile repair": "Repair Shop",
    "electronics repair": "Repair Shop",
}


def normalize_category(
    value: Optional[str],
) -> str:
    """
    Convert category aliases into the platform's canonical category.

    Examples
    --------
    grocery store -> Kirana
    milk shop     -> Dairy
    tailor        -> Tailoring
    """

    if value is None:
        return ""

    normalized = " ".join(
        str(value)
        .strip()
        .lower()
        .split()
    )

    if not normalized:
        return ""

    return CATEGORY_ALIASES.get(
        normalized,
        str(value).strip(),
    )


# ---------------------------------------------------------------------------
# Business-name normalization
# ---------------------------------------------------------------------------

def normalize_name(
    value: Optional[str],
) -> str:
    """
    Normalize a business name for deduplication.
    """

    if value is None:
        return ""

    return " ".join(
        str(value)
        .strip()
        .lower()
        .split()
    )


# ---------------------------------------------------------------------------
# Geographic helpers
# ---------------------------------------------------------------------------

def haversine_km(
    lat1: float,
    lng1: float,
    lat2: float,
    lng2: float,
) -> float:
    """
    Calculate distance between two geographic coordinates.

    Returns
    -------
    float
        Distance in kilometres.
    """

    earth_radius_km = 6371.0088

    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)

    delta_lat = radians(lat2 - lat1)
    delta_lng = radians(lng2 - lng1)

    a = (
        sin(delta_lat / 2) ** 2
        + cos(lat1_rad)
        * cos(lat2_rad)
        * sin(delta_lng / 2) ** 2
    )

    # Guard against tiny floating-point drift.
    a = max(
        0.0,
        min(1.0, a),
    )

    return (
        2
        * earth_radius_km
        * asin(sqrt(a))
    )


def safe_coordinates(
    record: Dict[str, Any],
) -> Optional[tuple]:
    """
    Extract coordinates from common field names.

    Supported:
        lat / lng
        latitude / longitude
    """

    if not isinstance(record, dict):
        return None

    lat = (
        record.get("lat")
        if record.get("lat") is not None
        else record.get("latitude")
    )

    lng = (
        record.get("lng")
        if record.get("lng") is not None
        else record.get("longitude")
    )

    try:
        if lat is None or lng is None:
            return None

        lat_value = float(lat)
        lng_value = float(lng)

        if not (
            -90 <= lat_value <= 90
            and -180 <= lng_value <= 180
        ):
            return None

        return (
            lat_value,
            lng_value,
        )

    except (
        TypeError,
        ValueError,
    ):
        return None


# ---------------------------------------------------------------------------
# Business extraction
# ---------------------------------------------------------------------------

def extract_businesses(
    location_record: Optional[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Extract business listings from the location record.

    Supports the current project's:
        existingBusinesses

    and future normalized names:
        businesses
        businessListings
        businessesWithinRadius
    """

    if not location_record:
        return []

    candidates = (
        location_record.get(
            "existingBusinesses"
        )
        or location_record.get(
            "businesses"
        )
        or location_record.get(
            "businessListings"
        )
        or location_record.get(
            "businessesWithinRadius"
        )
        or []
    )

    if not isinstance(
        candidates,
        list,
    ):
        return []

    return [
        item
        for item in candidates
        if isinstance(item, dict)
    ]


# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------

def deduplicate_businesses(
    businesses: Iterable[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Deduplicate business records.

    Identifier priority
    -------------------
    1. id
    2. businessId
    3. udyamId
    4. registrationId
    5. name + coordinates
    6. name + category
    7. unique fallback

    This is necessary because the same business may appear in:
        - government registration data
        - online listings
        - field verification
    """

    unique: Dict[str, Dict[str, Any]] = {}

    fallback_index = 0

    for business in businesses:

        business_id = (
            business.get("id")
            or business.get("businessId")
            or business.get("udyamId")
            or business.get("registrationId")
        )

        name = normalize_name(
            business.get("name")
        )

        category = normalize_category(
            business.get("category")
            or business.get("businessCategory")
            or business.get("type")
        )

        coordinates = safe_coordinates(
            business
        )

        if business_id:

            key = (
                "id:"
                + str(
                    business_id
                ).strip().lower()
            )

        elif name and coordinates:

            key = (
                f"name:{name}:"
                f"{round(coordinates[0], 5)}:"
                f"{round(coordinates[1], 5)}"
            )

        elif name and category:

            key = (
                f"name:{name}:"
                f"category:{category.lower()}"
            )

        else:

            fallback_index += 1

            key = (
                f"unresolved:{fallback_index}"
            )

        if key not in unique:
            unique[key] = business

    return list(
        unique.values()
    )


# ---------------------------------------------------------------------------
# Category filtering
# ---------------------------------------------------------------------------

def find_category_competitors(
    businesses: Iterable[Dict[str, Any]],
    business_category: str,
) -> List[Dict[str, Any]]:
    """
    Keep only businesses belonging to the requested category.
    """

    target = normalize_category(
        business_category
    )

    if not target:
        return []

    matches = []

    for business in businesses:

        category = normalize_category(
            business.get("category")
            or business.get("businessCategory")
            or business.get("type")
        )

        if category == target:
            matches.append(
                business
            )

    return matches


# ---------------------------------------------------------------------------
# Radius validation
# ---------------------------------------------------------------------------

def filter_by_radius(
    businesses: Iterable[Dict[str, Any]],
    center_lat: Optional[float],
    center_lng: Optional[float],
    radius_km: float,
) -> List[Dict[str, Any]]:
    """
    Filter businesses using the requested geographic radius.

    If the center coordinates are unavailable:
        - retain the records
        - do not claim radius validation

    If an individual business lacks coordinates:
        - retain it
        - mark its distance as unverified

    This avoids silently deleting identifiable evidence.
    """

    businesses = list(
        businesses
    )

    try:
        radius = float(
            radius_km
        )

    except (
        TypeError,
        ValueError,
    ):
        radius = 8.0

    if radius <= 0:
        radius = 8.0

    if (
        center_lat is None
        or center_lng is None
    ):
        return businesses

    results = []

    for business in businesses:

        coordinates = safe_coordinates(
            business
        )

        if coordinates is None:

            copied = dict(
                business
            )

            copied[
                "_distanceVerified"
            ] = False

            copied[
                "_distanceKm"
            ] = None

            results.append(
                copied
            )

            continue

        distance = haversine_km(
            float(center_lat),
            float(center_lng),
            coordinates[0],
            coordinates[1],
        )

        if distance <= radius:

            copied = dict(
                business
            )

            copied[
                "_distanceKm"
            ] = round(
                distance,
                2,
            )

            copied[
                "_distanceVerified"
            ] = True

            results.append(
                copied
            )

    return results


# ---------------------------------------------------------------------------
# Source hierarchy
# ---------------------------------------------------------------------------

def source_tier_for(
    source: Optional[str],
) -> str:
    """
    Convert source names into the platform's source hierarchy.
    """

    if not source:
        return "assumption"

    normalized = (
        str(source)
        .strip()
        .lower()
    )

    if (
        normalized in {
            "census",
            "census of india",
            "udyam",
            "asuse",
            "government",
            "official_government",
        }
        or "government" in normalized
        or "census" in normalized
        or "udyam" in normalized
        or "asuse" in normalized
    ):
        return "official_government"

    if (
        normalized in {
            "verified_local",
            "field",
            "field_verified",
            "local_verified",
        }
        or "verified" in normalized
        or "field" in normalized
    ):
        return "verified_local"

    if (
        normalized in {
            "research",
            "secondary",
            "secondary_research",
        }
        or "research" in normalized
    ):
        return "secondary_research"

    return "assumption"


# ---------------------------------------------------------------------------
# Map points
# ---------------------------------------------------------------------------

def build_points(
    businesses: Iterable[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Convert businesses with coordinates into map points.
    """

    points = []

    for business in businesses:

        coordinates = safe_coordinates(
            business
        )

        if coordinates is None:
            continue

        points.append(
            {
                "lat": coordinates[0],
                "lng": coordinates[1],
                "name": (
                    business.get("name")
                    or "Unnamed business"
                ),
                "category": normalize_category(
                    business.get("category")
                    or business.get("businessCategory")
                    or business.get("type")
                ),
            }
        )

    return points


# ---------------------------------------------------------------------------
# Main evidence engine
# ---------------------------------------------------------------------------

def build_competitor_evidence(
    *,
    location_record: Optional[Dict[str, Any]],
    business_category: str,
    radius_km: float = 8,
    center_lat: Optional[float] = None,
    center_lng: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Build the complete Phase 5 competition evidence object.
    """

    raw_businesses = extract_businesses(
        location_record
    )

    # -------------------------------------------------------
    # No evidence at all
    # -------------------------------------------------------

    if not raw_businesses:

        return {
            "identifiable": False,
            "count": None,
            "points": [],
            "source": None,
            "sourceTier": "assumption",
            "dataYear": None,
            "lastUpdated": None,
            "coverage": "unknown",
            "geographicMatch": "unknown",
            "confidence": "low",
            "deduplicated": 0,
            "categoryMatches": 0,
            "radiusValidated": False,
            "dataConfidenceNote": (
                "No category-specific business "
                "listings were available for this "
                "location. The absence of identified "
                "businesses does not mean that no "
                "competitors exist."
            ),
        }

    # -------------------------------------------------------
    # Deduplicate
    # -------------------------------------------------------

    unique_businesses = (
        deduplicate_businesses(
            raw_businesses
        )
    )

    # -------------------------------------------------------
    # Category filter
    # -------------------------------------------------------

    category_matches = (
        find_category_competitors(
            unique_businesses,
            business_category,
        )
    )

    # -------------------------------------------------------
    # Radius filter
    # -------------------------------------------------------

    radius_matches = filter_by_radius(
        category_matches,
        center_lat,
        center_lng,
        radius_km,
    )

    identifiable_count = len(
        radius_matches
    )

    verified_location_count = sum(
        1
        for business in radius_matches
        if business.get(
            "_distanceVerified"
        )
        is True
    )

    # -------------------------------------------------------
    # Metadata
    # -------------------------------------------------------

    source = (
        location_record.get(
            "source"
        )
        if location_record
        else None
    )

    if not source and location_record:

        source = location_record.get(
            "dataSource"
        )

    data_year = (
        location_record.get(
            "dataYear"
        )
        if location_record
        else None
    )

    last_updated = (
        location_record.get(
            "lastUpdated"
        )
        if location_record
        else None
    )

    coverage = (
        location_record.get(
            "businessCoverage"
        )
        if location_record
        else None
    )

    if not coverage and location_record:
        coverage = location_record.get(
            "coverage"
        )

    coverage = (
        coverage
        or "partial"
    )

    radius_validated = (
        center_lat is not None
        and center_lng is not None
    )

    if radius_validated:

        geographic_match = (
            "exact"
            if verified_location_count > 0
            else "unknown"
        )

    else:

        geographic_match = "unknown"

    source_tier = source_tier_for(
        source
    )

    # -------------------------------------------------------
    # Confidence
    # -------------------------------------------------------

    if identifiable_count == 0:

        confidence = "low"

    elif source_tier == "official_government":

        confidence = (
            "high"
            if (
                radius_validated
                and geographic_match == "exact"
            )
            else "medium"
        )

    elif source_tier == "verified_local":

        confidence = (
            "high"
            if (
                radius_validated
                and geographic_match == "exact"
            )
            else "medium"
        )

    elif source_tier == "secondary_research":

        confidence = "medium"

    else:

        confidence = (
            "medium"
            if (
                radius_validated
                and geographic_match == "exact"
            )
            else "low"
        )

    canonical_category = (
        normalize_category(
            business_category
        )
    )

    # -------------------------------------------------------
    # Final evidence object
    # -------------------------------------------------------

    return {
        "identifiable": True,

        "count": identifiable_count,

        "points": build_points(
            radius_matches
        ),

        "source": source,

        "sourceTier": source_tier,

        "dataYear": data_year,

        "lastUpdated": last_updated,

        "coverage": coverage,

        "geographicMatch": geographic_match,

        "confidence": confidence,

        "deduplicated": len(
            unique_businesses
        ),

        "categoryMatches": len(
            category_matches
        ),

        "radiusValidated": radius_validated,

        "dataConfidenceNote": (
            f"{identifiable_count} identifiable "
            f"{canonical_category} businesses were "
            "found using available data. "
            "This is not a complete count of all "
            "businesses. Informal, unlisted, newly "
            "opened, or otherwise unobserved "
            "businesses may be missing."
        ),
    }