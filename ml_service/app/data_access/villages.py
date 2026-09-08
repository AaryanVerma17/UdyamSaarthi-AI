"""
Shared village data access.

Important:
Village names are NOT globally unique.

Matching therefore uses:
    village + district + state
and optionally:
    + block

A village is NEVER matched using village name alone.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional


DATA_FILE = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "villages.json"
)


def _normalize(value: Optional[str]) -> str:
    """
    Normalize user/data values for safe comparison.
    """
    if value is None:
        return ""

    return " ".join(
        str(value)
        .strip()
        .lower()
        .split()
    )


def load_villages() -> List[Dict[str, Any]]:
    """
    Load normalized village records.

    Supports both:
        {"villages": [...]}

    and:
        [...]
    """

    with DATA_FILE.open(
        "r",
        encoding="utf-8",
    ) as file:
        payload = json.load(file)

    if isinstance(payload, dict):
        villages = payload.get(
            "villages",
            [],
        )

        return (
            villages
            if isinstance(villages, list)
            else []
        )

    if isinstance(payload, list):
        return payload

    return []


def find_village(
    village: str,
    district: Optional[str] = None,
    state: Optional[str] = None,
    block: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Find an exact village record.

    Matching hierarchy:

    1. village + block + district + state
    2. village + district + state

    Deliberately does NOT match village name alone.

    This prevents a village with the same name in another
    district/state from receiving incorrect data.
    """

    target_village = _normalize(village)
    target_block = _normalize(block)
    target_district = _normalize(district)
    target_state = _normalize(state)

    if not target_village:
        return None

    records = load_villages()

    # ---------------------------------------------------------
    # Strongest match:
    # village + block + district + state
    # ---------------------------------------------------------
    if target_block:
        for record in records:
            if (
                _normalize(record.get("village"))
                == target_village
                and _normalize(record.get("block"))
                == target_block
                and _normalize(record.get("district"))
                == target_district
                and _normalize(record.get("state"))
                == target_state
            ):
                return record

    # ---------------------------------------------------------
    # Exact village + district + state
    # ---------------------------------------------------------
    for record in records:
        if (
            _normalize(record.get("village"))
            == target_village
            and _normalize(record.get("district"))
            == target_district
            and _normalize(record.get("state"))
            == target_state
        ):
            return record

    # ---------------------------------------------------------
    # NEVER match by village name alone.
    # ---------------------------------------------------------
    return None


def find_by_district(
    district: str,
    state: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Return records for district-level fallback analysis.

    IMPORTANT:
    These records must never be silently presented as
    exact village observations.
    """

    target_district = _normalize(district)
    target_state = _normalize(state)

    if not target_district:
        return []

    records: List[Dict[str, Any]] = []

    for record in load_villages():
        if (
            _normalize(record.get("district"))
            != target_district
        ):
            continue

        if target_state:
            if (
                _normalize(record.get("state"))
                != target_state
            ):
                continue

        records.append(record)

    return records