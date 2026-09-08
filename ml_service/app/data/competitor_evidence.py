"""
UdyamSaarthi-AI — Competitor Evidence Engine.

Phase 5 responsibilities:
- Normalize business categories.
- Filter businesses by requested category.
- Validate geographic radius.
- Deduplicate businesses from multiple sources.
- Distinguish identifiable businesses from estimates.
- Preserve source/provenance information.

Important:
An identifiable competitor count is NOT a census of all businesses.
Informal, unregistered, newly opened, or otherwise unobserved businesses
may not be present in the available data.
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

    "kirana": "Kirana",
    "grocery": "Kirana",
    "grocery store": "Kirana",
    "general store": "Kirana",

    "tailoring": "Tailoring",
    "tailor": "Tailoring",
    "tailoring shop": "Tailoring",

    "food processing": "Food Processing",
    "food processor": "Food Processing",
    "food manufacturing": "Food Processing",

    "repair shop": "Repair Shop",
    "repair": "Repair Shop",
    "mobile repair": "Repair Shop",
    "electronics repair": "Repair Shop",
}


def normalize_category(value: Optional[str]) -> str:
    """
    Normalize a category while preserving unknown categories.

    Examples:
        dairy       -> Dairy
        milk shop   -> Dairy
        grocery     -> Kirana
        tailor      -> Tailoring
    """

    if not value:
        return ""

    normalized = (
        str(value)
        .strip()
        .lower()
    )

    return CATEGORY_ALIASES.get(
        normalized,
        str(value).strip(),
    )


# ---------------------------------------------------------------------------
# Business-name normalization
# ---------------------------------------------------------------------------

def normalize_name(value: Optional[str]) -> str:
    """
    Normalize business names for deduplication.
    """

    if not value:
        return ""

    return " ".join(
        str(value)
        .strip()
        .lower()
        .split()
    )


# ---------------------------------------------------------------------------
# Geographic distance
# ---------------------------------------------------------------------------

def haversine_km(
    lat1: float,
    lng1: float,
    lat2: float,
    lng2: float,
) -> float:
    """
    Calculate great-circle distance between two coordinates.
    """

    earth_radius_km = 6371.0088

    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)

    delta_lat = radians(
        lat2 - lat1
    )

    delta_lng = radians(
        lng2 - lng1
    )

    a = (
        sin(delta_lat / 2) ** 2
        + cos(lat1_rad)
        * cos(lat2_rad)
        * sin(delta_lng / 2) ** 2
    )

    return (
        2
        * earth_radius_km
        * asin(sqrt(a))
    )


# ---------------------------------------------------------------------------
# Coordinate handling
# ---------------------------------------------------------------------------

def safe_coordinates(
    record: Dict[str, Any],
):
    """
    Read common coordinate field names.

    Returns:
        (latitude, longitude)

    or:
        (None, None)
    """

    latitude = record.get("lat")

    if latitude is None:
        latitude = record.get("latitude")

    longitude = record.get("lng")

    if longitude is None:
        longitude = record.get("lon")

    if longitude is None:
        longitude = record.get("longitude")

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (
        TypeError,
        ValueError,
    ):
        return None, None

    if not (
        -90 <= latitude <= 90
        and -180 <= longitude <= 180
    ):
        return None, None

    return latitude, longitude


# ---------------------------------------------------------------------------
# Candidate extraction
# ---------------------------------------------------------------------------

def extract_businesses(
    location_record: Optional[
        Dict[str, Any]
    ],
) -> List[Dict[str, Any]]:
    """
    Extract business records from a resolved location.

    Supports:
        existingBusinesses
        businesses
        competitors

    Missing lists produce an empty list rather than an estimate.
    """

    if not location_record:
        return []

    candidates: List[Dict[str, Any]] = []

    for field in (
        "existingBusinesses",
        "businesses",
        "competitors",
    ):
        records = location_record.get(
            field,
            []
        )

        if not isinstance(
            records,
            list,
        ):
            continue

        candidates.extend(
            item
            for item in records
            if isinstance(item, dict)
        )

    return candidates


# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------

def _deduplication_key(
    business: Dict[str, Any],
    fallback_index: int,
):
    """
    Build a stable identity key.

    Priority:
        1. Explicit business ID
        2. Name + coordinates
        3. Name + category
        4. Unique fallback

    This prevents the same business appearing in multiple evidence
    sources from being counted multiple times.
    """

    business_id = (
        business.get("id")
        or business.get("businessId")
        or business.get("business_id")
    )

    if business_id:
        return (
            "id",
            str(business_id)
            .strip()
            .lower(),
        )

    name = normalize_name(
        business.get("name")
    )

    category = normalize_category(
        business.get("category")
    )

    lat, lng = safe_coordinates(
        business
    )

    if name and lat is not None and lng is not None:
        return (
            "name-coordinates",
            name,
            round(lat, 5),
            round(lng, 5),
        )

    if name and category:
        return (
            "name-category",
            name,
            category.lower(),
        )

    return (
        "fallback",
        fallback_index,
    )


def deduplicate_businesses(
    businesses: Iterable[
        Dict[str, Any]
    ],
) -> List[Dict[str, Any]]:
    """
    Deduplicate business evidence.

    The first occurrence is retained.
    """

    unique: Dict[Any, Dict[str, Any]] = {}

    fallback_index = 0

    for business in businesses:

        if not isinstance(
            business,
            dict,
        ):
            continue

        key = _deduplication_key(
            business,
            fallback_index,
        )

        fallback_index += 1

        if key not in unique:
            unique[key] = dict(
                business
            )

    return list(
        unique.values()
    )


# ---------------------------------------------------------------------------
# Category filtering
# ---------------------------------------------------------------------------

def filter_category(
    businesses: Iterable[
        Dict[str, Any]
    ],
    business_category: str,
) -> List[Dict[str, Any]]:
    """
    Keep only businesses belonging to the requested category.
    """

    requested = normalize_category(
        business_category
    )

    if not requested:
        return []

    results = []

    for business in businesses:

        category = normalize_category(
            business.get("category")
        )

        if category == requested:
            results.append(
                dict(business)
            )

    return results


# ---------------------------------------------------------------------------
# Radius filtering
# ---------------------------------------------------------------------------

def filter_by_radius(
    businesses: Iterable[
        Dict[str, Any]
    ],
    *,
    center_lat: Optional[float],
    center_lng: Optional[float],
    radius_km: float,
) -> List[Dict[str, Any]]:
    """
    Keep businesses within the requested radius.

    If the center or business coordinates are unavailable, the business
    is not treated as geographically validated.
    """

    if radius_km <= 0:
        raise ValueError(
            "radius_km must be greater than zero"
        )

    if (
        center_lat is None
        or center_lng is None
    ):
        return []

    results = []

    for business in businesses:

        lat, lng = safe_coordinates(
            business
        )

        if lat is None or lng is None:
            continue

        distance = haversine_km(
            center_lat,
            center_lng,
            lat,
            lng,
        )

        if distance <= radius_km:
            copied = dict(
                business
            )

            copied["_distanceKm"] = round(
                distance,
                3,
            )

            copied[
                "_distanceVerified"
            ] = True

            results.append(
                copied
            )

    return results


# ---------------------------------------------------------------------------
# Main evidence builder
# ---------------------------------------------------------------------------

def build_competitor_evidence(
    *,
    location_record: Optional[
        Dict[str, Any]
    ],
    business_category: str,
    radius_km: float = 8,
    center_lat: Optional[float] = None,
    center_lng: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Build category-specific competition evidence.

    The function deliberately does NOT use:
        existingBusinessDensity

    as a competitor count.

    That field represents broader business density and cannot be assumed
    to mean category-specific competitors.
    """

    category = normalize_category(
        business_category
    )

    candidates = extract_businesses(
        location_record
    )

    # No business evidence available.
    if not candidates:
        return {
            "count": None,
            "identifiable": False,
            "category": category or business_category,
            "radiusKm": radius_km,
            "radiusValidated": False,
            "deduplicatedCount": 0,
            "points": [],
            "confidence": "low",
            "coverage": "unknown",
            "source": None,
            "sourceTier": "assumption",
            "dataConfidenceNote": (
                "No category-specific competitor data "
                "was available for this location. "
                "This does not mean that no competitors exist."
            ),
        }

    # Normalize and deduplicate first.
    deduplicated = deduplicate_businesses(
        candidates
    )

    category_businesses = filter_category(
        deduplicated,
        category,
    )

    # Determine location center.
    if (
        center_lat is None
        or center_lng is None
    ):
        if location_record:
            center_lat, center_lng = (
                safe_coordinates(
                    location_record
                )
            )

    # Geographic validation.
    radius_businesses = filter_by_radius(
        category_businesses,
        center_lat=center_lat,
        center_lng=center_lng,
        radius_km=radius_km,
    )

    radius_validated = (
        center_lat is not None
        and center_lng is not None
    )

    # If we cannot validate geography, don't claim
    # that these are competitors within the radius.
    if not radius_validated:
        return {
            "count": None,
            "identifiable": False,
            "category": category,
            "radiusKm": radius_km,
            "radiusValidated": False,
            "deduplicatedCount": len(
                category_businesses
            ),
            "points": [],
            "confidence": "low",
            "coverage": "partial",
            "source": (
                location_record.get(
                    "source"
                )
                if location_record
                else None
            ),
            "sourceTier": (
                location_record.get(
                    "sourceTier",
                    "assumption",
                )
                if location_record
                else "assumption"
            ),
            "dataConfidenceNote": (
                "Category-specific businesses were "
                "identified, but their geographic distance "
                "could not be validated. The result is not "
                "treated as a radius-validated competitor count."
            ),
        }

    points = []

    for business in radius_businesses:

        lat, lng = safe_coordinates(
            business
        )

        points.append(
            {
                "name": str(
                    business.get(
                        "name",
                        "Unnamed business",
                    )
                ),
                "category": normalize_category(
                    business.get(
                        "category"
                    )
                ),
                "lat": lat,
                "lng": lng,
                "distanceKm": business.get(
                    "_distanceKm"
                ),
            }
        )

    source = (
        location_record.get(
            "source"
        )
        if location_record
        else None
    )

    source_tier = (
        location_record.get(
            "sourceTier",
            "assumption",
        )
        if location_record
        else "assumption"
    )

    # Demo/seed evidence is intentionally low confidence.
    if source == "seed_demo_v1":
        confidence = "low"
    else:
        confidence = (
            location_record.get(
                "dataConfidence",
                "medium",
            )
            if location_record
            else "low"
        )

    count = len(
        radius_businesses
    )

    return {
        "count": count,
        "identifiable": True,
        "category": category,
        "radiusKm": radius_km,
        "radiusValidated": True,
        "deduplicatedCount": len(
            deduplicated
        ),
        "points": points,
        "confidence": confidence,
        "coverage": (
            location_record.get(
                "coverage",
                "partial",
            )
            if location_record
            else "partial"
        ),
        "source": source,
        "sourceTier": source_tier,
        "dataYear": (
            location_record.get(
                "dataYear"
            )
            if location_record
            else None
        ),
        "lastUpdated": (
            location_record.get(
                "lastUpdated"
            )
            if location_record
            else None
        ),
        "dataConfidenceNote": (
            f"{count} identifiable "
            f"{category} businesses were found "
            "using available data within the "
            f"{radius_km:g} km analysis radius. "
            "This is not a complete count of all "
            "businesses; informal, unlisted, newly "
            "opened, or otherwise unobserved businesses "
            "may not be captured."
        ),
    }