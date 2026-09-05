"""
Shared read-access helper over ml_service/app/data/villages.json, used by
multiple modules (location_intelligence, competitor_mapping, pricing) so
they all agree on the same underlying record instead of re-implementing
their own lookup.
"""
import json
from pathlib import Path
from typing import Optional

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "villages.json"


def load_dataset() -> dict:
    if DATA_PATH.exists():
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"villages": []}


def find_village(village_name: str) -> Optional[dict]:
    dataset = load_dataset()
    for v in dataset.get("villages", []):
        if v["village"].strip().lower() == village_name.strip().lower():
            return v
    return None
