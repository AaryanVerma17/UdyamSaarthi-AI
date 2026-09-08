"""
UdyamSaarthi-AI evidence ingestion pipeline.

Input:
    CSV containing normalized village/location data.

Output:
    ml_service/app/data/villages.json

This script intentionally does NOT scrape arbitrary websites.

Official datasets should be downloaded/obtained through
their permitted publication/API mechanisms and then
normalized into the CSV schema before ingestion.
"""

import argparse
import csv
import json

from datetime import datetime, timezone
from pathlib import Path


OUTPUT_PATH = (
    Path(__file__).resolve().parents[2]
    / "ml_service"
    / "app"
    / "data"
    / "villages.json"
)


REQUIRED_COLUMNS = {
    "village",
    "district",
    "state",
    "consumerBase",
    "source",
    "dataYear",
    "lastUpdated",
}


def parse_args():

    parser = argparse.ArgumentParser(
        description="Build UdyamSaarthi evidence dataset."
    )

    parser.add_argument(
        "--input",
        required=True,
        help="Normalized input CSV path.",
    )

    parser.add_argument(
        "--output",
        default=str(OUTPUT_PATH),
        help="Output JSON path.",
    )

    return parser.parse_args()


def clean(value):

    if value is None:
        return ""

    return str(value).strip()


def parse_number(value, default=0):

    try:
        return int(float(clean(value)))

    except (TypeError, ValueError):
        return default


def validate_headers(fieldnames):

    missing = REQUIRED_COLUMNS - set(
        fieldnames or []
    )

    if missing:

        raise ValueError(
            "Missing required columns: "
            + ", ".join(sorted(missing))
        )


def normalize_row(row):

    source = (
        clean(row.get("source"))
        or "unknown"
    )

    return {
        "village": clean(
            row.get("village")
        ),

        "block": clean(
            row.get("block")
        ),

        "district": clean(
            row.get("district")
        ),

        "state": clean(
            row.get("state")
        ),

        "consumerBase": parse_number(
            row.get("consumerBase")
        ),

        "purchasingPowerIndex": (
            clean(
                row.get(
                    "purchasingPowerIndex"
                )
            )
            or "unknown"
        ),

        "existingBusinessDensity": parse_number(
            row.get(
                "existingBusinessDensity"
            )
        ),

        "marketsAndHaats": [
            item.strip()
            for item in clean(
                row.get("marketsAndHaats")
            ).split("|")
            if item.strip()
        ],

        "distributionChannels": [
            item.strip()
            for item in clean(
                row.get(
                    "distributionChannels"
                )
            ).split("|")
            if item.strip()
        ],

        "livestockIndex": (
            clean(
                row.get("livestockIndex")
            )
            or "unknown"
        ),

        "radiusKm": parse_number(
            row.get("radiusKm"),
            default=8,
        ),

        "source": source,

        "dataYear": (
            parse_number(
                row.get("dataYear")
            )
            if clean(
                row.get("dataYear")
            )
            else None
        ),

        "lastUpdated": clean(
            row.get("lastUpdated")
        ) or None,

        "dataConfidence": (
            clean(
                row.get("dataConfidence")
            )
            or "low"
        ),

        "geographicMatch": (
            clean(
                row.get(
                    "geographicMatch"
                )
            )
            or "exact"
        ),

        "coverage": (
            clean(
                row.get("coverage")
            )
            or "partial"
        ),

        "dataNotes": (
            clean(
                row.get("dataNotes")
            )
            or None
        ),
    }


def main():

    args = parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():

        raise FileNotFoundError(
            f"Input file does not exist: "
            f"{input_path}"
        )

    records = []

    with input_path.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as file:

        reader = csv.DictReader(file)

        validate_headers(
            reader.fieldnames
        )

        for row_number, row in enumerate(
            reader,
            start=2,
        ):

            record = normalize_row(row)

            if not record["village"]:

                raise ValueError(
                    f"Row {row_number}: "
                    "village is required."
                )

            if not record["district"]:

                raise ValueError(
                    f"Row {row_number}: "
                    "district is required."
                )

            if not record["state"]:

                raise ValueError(
                    f"Row {row_number}: "
                    "state is required."
                )

            records.append(record)

    payload = {
        "metadata": {
            "datasetVersion": "phase3-evidence-v1",
            "generatedAt": datetime.now(
                timezone.utc
            ).isoformat(),

            "recordCount": len(records),

            "description": (
                "Normalized evidence records. "
                "Coverage and confidence depend "
                "on the underlying source."
            ),
        },

        "villages": records,
    }

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with output_path.open(
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            payload,
            file,
            ensure_ascii=False,
            indent=2,
        )

    print(
        f"Created {output_path} "
        f"with {len(records)} records."
    )


if __name__ == "__main__":
    main()