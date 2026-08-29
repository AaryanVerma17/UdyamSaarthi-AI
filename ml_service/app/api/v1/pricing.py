"""
Module 10 — Localized Pricing
Mock regression today; upgrade to a real model over local mandi/competitor
price data (Kavya), grounded via the RAG/vector-store layer (Aaryan).
"""
from fastapi import APIRouter
from app.schemas.models import PricingRequest, PricingResponse

router = APIRouter()

PRICE_TABLE = {
    "Dairy": ([30.0, 45.0], "per litre"),
    "Kirana": ([0.0, 0.0], "varies by SKU"),
    "Tailoring": ([150.0, 500.0], "per garment"),
}


@router.post("/pricing", response_model=PricingResponse)
def recommend_pricing(payload: PricingRequest):
    price_range, unit = PRICE_TABLE.get(payload.businessCategory, ([100.0, 300.0], "per unit"))
    return PricingResponse(
        range=price_range,
        unit=unit,
        confidence="medium",
        basedOn=["nearby_market_prices (mock)", "competitor_pricing (mock)", "input_costs (mock)"],
    )
