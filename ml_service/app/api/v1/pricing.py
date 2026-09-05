"""
Module 10 — Localized Pricing

Real implementation: uses the village's actual mandiPrices when available
(from ml_service/app/data/villages.json), adjusted by purchasing-power
index. Falls back to a generic category price table when no local price
data exists for that village — and always reports which path was used via
`confidence` and `basedOn`, per the team's data-confidence decision.
"""
from fastapi import APIRouter
from app.schemas.models import PricingRequest, PricingResponse
from app.data_access.villages import find_village

router = APIRouter()

# Generic fallback table: {businessCategory: (price_range, unit, price_key_hint)}
GENERIC_TABLE = {
    "Dairy": ([30.0, 45.0], "per litre", "milk_per_litre"),
    "Kirana": ([0.0, 0.0], "varies by SKU", None),
    "Tailoring": ([150.0, 500.0], "per garment", None),
    "Food Processing": ([80.0, 220.0], "per kg", None),
    "Repair Shop": ([100.0, 400.0], "per service", None),
}

PURCHASING_POWER_MULTIPLIER = {
    "low": 0.9,
    "low-medium": 0.95,
    "medium": 1.0,
    "medium-high": 1.08,
    "high": 1.15,
}


@router.post("/pricing", response_model=PricingResponse)
def recommend_pricing(payload: PricingRequest):
    price_range, unit, price_key = GENERIC_TABLE.get(payload.businessCategory, ([100.0, 300.0], "per unit", None))
    village_record = find_village(payload.geoContext.village) if payload.geoContext.village else None

    if village_record and price_key and price_key in village_record.get("mandiPrices", {}):
        real_range = village_record["mandiPrices"][price_key]
        return PricingResponse(
            range=[float(real_range[0]), float(real_range[1])],
            unit=unit,
            confidence=village_record.get("dataConfidence", "medium"),
            basedOn=[f"local mandi price data ({village_record.get('dataSource', 'unknown source')})"],
            lastUpdated=village_record.get("lastUpdated"),
        )

    # No local mandi data for this category/village — use the generic table,
    # scaled by the area's purchasing power so it's still hyper-local-ish
    multiplier = PURCHASING_POWER_MULTIPLIER.get(payload.geoContext.purchasingPowerIndex, 1.0)
    adjusted_range = [round(price_range[0] * multiplier, 2), round(price_range[1] * multiplier, 2)]

    return PricingResponse(
        range=adjusted_range,
        unit=unit,
        confidence="low",
        basedOn=["generic category price table", "adjusted by local purchasing power index — no local mandi price data available"],
        lastUpdated=None,
    )
