"""
Module 10 — Localized Pricing

PHASE 0:

A generic price table is an assumption, not local market evidence.

Therefore:

- local observed data gets higher evidentiary status
- generic fallback is explicitly marked as estimated
- the report must not describe a generic fallback as a local price
"""

from fastapi import APIRouter

from app.schemas.models import (
    PricingRequest,
    PricingResponse,
)

from app.data_access.villages import find_village


router = APIRouter()


GENERIC_TABLE = {
    "Dairy": (
        [30.0, 45.0],
        "per litre",
        "milk_per_litre",
    ),
    "Kirana": (
        [0.0, 0.0],
        "varies by SKU",
        None,
    ),
    "Tailoring": (
        [150.0, 500.0],
        "per garment",
        None,
    ),
    "Food Processing": (
        [80.0, 220.0],
        "per kg",
        None,
    ),
    "Repair Shop": (
        [100.0, 400.0],
        "per service",
        None,
    ),
}


PURCHASING_POWER_MULTIPLIER = {
    "low": 0.90,
    "low-medium": 0.95,
    "medium": 1.00,
    "medium-high": 1.08,
    "high": 1.15,
}


@router.post(
    "/pricing",
    response_model=PricingResponse,
)
def recommend_pricing(
    payload: PricingRequest,
):
    (
        generic_range,
        unit,
        price_key,
    ) = GENERIC_TABLE.get(
        payload.businessCategory,
        (
            [100.0, 300.0],
            "per unit",
            None,
        ),
    )

    village_record = (
        find_village(
            payload.geoContext.village
        )
        if payload.geoContext.village
        else None
    )

    if (
        village_record
        and price_key
        and price_key
        in village_record.get(
            "mandiPrices",
            {},
        )
    ):
        real_range = village_record[
            "mandiPrices"
        ][price_key]

        return PricingResponse(
            range=[
                float(real_range[0]),
                float(real_range[1]),
            ],
            unit=unit,
            confidence=village_record.get(
                "dataConfidence",
                "medium",
            ),
            basedOn=[
                (
                    "local price data: "
                    + village_record.get(
                        "dataSource",
                        "unknown source",
                    )
                )
            ],
            lastUpdated=village_record.get(
                "lastUpdated"
            ),
            estimated=False,
            sourceType=village_record.get(
                "sourceType",
                "local_dataset",
            ),
        )

    purchasing_power = (
        payload.geoContext.purchasingPowerIndex
    )

    multiplier = PURCHASING_POWER_MULTIPLIER.get(
        purchasing_power,
        1.0,
    )

    adjusted_range = [
        round(
            generic_range[0] * multiplier,
            2,
        ),
        round(
            generic_range[1] * multiplier,
            2,
        ),
    ]

    return PricingResponse(
        range=adjusted_range,
        unit=unit,
        confidence="low",
        basedOn=[
            "development fallback price assumption",
            (
                "purchasing-power adjustment"
                if purchasing_power != "unknown"
                else
                "no reliable local purchasing-power signal"
            ),
        ],
        lastUpdated=None,
        estimated=True,
        sourceType="development_assumption",
    )