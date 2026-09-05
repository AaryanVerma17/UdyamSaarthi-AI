"""
scripts/data_ingestion/ingest.py — Piyush

Builds ml_service/app/data/villages.json from source datasets, following
the team's official-source-priority decision:

    Official Government Data -> Verified/Recent Local Data ->
    Research/Secondary Data -> Kaggle/Other datasets

Today this script ships with a CSV -> JSON normalizer plus a manual-entry
path, since public Census 2027 datasets are still being progressively
published. Point SOURCE_CSV at whatever you've collected (Census 2011/2027,
MoSPI, Agriculture/Animal Husbandry Dept. exports, mandi price sheets) and
run it — every record keeps its source name and year so downstream
consumers (location_intelligence.py) can show data confidence honestly.

Usage:
    python ingest.py --source path/to/villages_raw.csv --out ../../ml_service/app/data/villages.json
    python ingest.py --add-manual   # interactive fallback for quick demo data entry
"""
import argparse
import csv
import json
import sys
from datetime import date
from pathlib import Path

REQUIRED_FIELDS = ["village", "block", "district", "state", "lat", "lng", "consumerBase"]


def load_existing(out_path: Path) -> dict:
    if out_path.exists():
        with open(out_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"_meta": {"description": "Ingested village dataset", "source": "ingest.py", "lastUpdated": str(date.today())}, "villages": []}


def ingest_csv(source_csv: Path, source_name: str) -> list:
    """
    Expected CSV columns (extend as your real sources provide more):
    village, block, district, state, lat, lng, consumerBase, purchasingPowerIndex,
    livestockIndex, dataConfidence
    """
    records = []
    with open(source_csv, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            missing = [field for field in REQUIRED_FIELDS if not row.get(field)]
            if missing:
                print(f"[ingest] Skipping row, missing fields {missing}: {row}", file=sys.stderr)
                continue
            records.append({
                "village": row["village"],
                "block": row["block"],
                "district": row["district"],
                "state": row["state"],
                "lat": float(row["lat"]),
                "lng": float(row["lng"]),
                "consumerBase": int(row["consumerBase"]),
                "purchasingPowerIndex": row.get("purchasingPowerIndex", "medium"),
                "livestockIndex": row.get("livestockIndex", "medium"),
                "existingBusinesses": [],
                "marketsAndHaats": [],
                "distributionChannels": [],
                "mandiPrices": {},
                "dataConfidence": row.get("dataConfidence", "low"),
                "dataSource": f"{source_name} ({date.today().isoformat()})",
            })
    return records


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, help="Path to a source CSV file")
    parser.add_argument("--source-name", default="unspecified_source", help="Label recorded as dataSource, e.g. 'census_2027' or 'mospi_2026'")
    parser.add_argument("--out", type=Path, default=Path(__file__).parent.parent.parent / "ml_service" / "app" / "data" / "villages.json")
    args = parser.parse_args()

    data = load_existing(args.out)

    if args.source:
        new_records = ingest_csv(args.source, args.source_name)
        existing_names = {v["village"] for v in data["villages"]}
        added = 0
        for record in new_records:
            if record["village"] not in existing_names:
                data["villages"].append(record)
                added += 1
        print(f"[ingest] Added {added} new village records from {args.source}")
    else:
        print("[ingest] No --source provided. Run with --source path/to/file.csv to ingest real data.")
        print("[ingest] See README.md in this folder for the prioritized source list.")

    data["_meta"]["lastUpdated"] = str(date.today())
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"[ingest] Wrote {len(data['villages'])} total village records to {args.out}")


if __name__ == "__main__":
    main()
