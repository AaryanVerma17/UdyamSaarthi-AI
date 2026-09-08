"""
Shared village data access.

Important:
Village names are NOT globally unique.

Matching therefore uses:

    village + district + state

and optionally block where available.
"""

import json
from pathlib import Path
from typing import Any, Dict, Optional


DATA_FILE = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "villages.json"
)


def _normalize(value: Optional[str]) -> str:
    if value is None:
        return ""

    return " ".join(
        str(value).strip().lower().split()
    )


def load_villages():
    with DATA_FILE.open(
        "r",
        encoding="utf-8",
    ) as file:

        payload = json.load(file)

    if isinstance(payload, dict):
        return payload.get("villages", [])

    if isinstance(payload, list):
        return payload

    return []


def find_village(
    village: str,
    district: Optional[str] = None,
    state: Optional[str] = None,
    block: Optional[str] = None,
) -> Optional[Dict[str, Any]]:

    target_village = _normalize(village)
    target_district = _normalize(district)
    target_state = _normalize(state)
    target_block = _normalize(block)

    if not target_village:
        return None

    records = load_villages()

    # Strongest match:
    # village + block + district + state
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

    # village + district + state
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

    # Never match by village name alone.
    #
    # The same village name can exist in multiple districts.
    #
    # Returning the first match could silently attach
    # incorrect population/business/economic data.

    return None