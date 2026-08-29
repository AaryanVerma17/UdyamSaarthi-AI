"""
Module 2 — Business Viability Engine
Mock heuristic scoring today; swap for the trained scikit-learn/XGBoost
model (Kavya) without changing the response contract.
"""
from fastapi import APIRouter
from app.schemas.models import ViabilityRequest, ViabilityResponse

router = APIRouter()

BUSINESS_BASE_SCORE = {
    "Dairy": 78,
    "Kirana": 60,
    "Tailoring": 70,
    "Food Processing": 68,
    "Repair Shop": 62,
}


@router.post("/viability", response_model=ViabilityResponse)
def score_viability(payload: ViabilityRequest):
    base = BUSINESS_BASE_SCORE.get(payload.businessCategory, 55)
    density_penalty = min(payload.geoContext.existingBusinessDensity, 10)
    score = max(0, min(100, base + 10 - density_penalty))

    label = "High Potential" if score >= 75 else "Moderate Potential" if score >= 50 else "Low Potential"

    explanation = (
        f"{payload.businessCategory} shows {label.lower()} in this area based on a "
        f"{payload.geoContext.livestockIndex} local activity index and "
        f"{payload.geoContext.existingBusinessDensity} existing similar businesses nearby. "
        f"(Mock model — replace with trained viability model.)"
    )

    return ViabilityResponse(
        score=score,
        label=label,
        explanation=explanation,
        breakEvenMonths=10 if score >= 75 else 16,
        expectedCashFlow=60000 if score >= 75 else 35000,
        drivers=["local_demand", "competition_density", "purchasing_power"],
        swot={
            "strengths": [f"Established local demand for {payload.businessCategory.lower()}"],
            "weaknesses": ["Limited initial working capital"],
            "opportunities": ["Underserved adjacent product lines"],
            "threats": ["Seasonal demand fluctuation", "Input price volatility"],
        },
    )
