"""
Module 2 — Business Viability Engine

Real implementation: a weighted, tunable scoring function over actual
GeoContext signals (consumer base, purchasing power, livestock index,
competitor density). This is a deliberate rule-based BASELINE, not a
trained model — you have no labeled outcome data yet (which villages'
funded businesses actually succeeded/failed) to train scikit-learn/
XGBoost against. Once that data exists, replace WEIGHTS/compute_score()
with a trained model but keep the same function signature and response
shape so nothing else in the pipeline needs to change.
"""
from fastapi import APIRouter
from app.schemas.models import ViabilityRequest, ViabilityResponse
from app.data_access.villages import find_village

router = APIRouter()

BUSINESS_BASE_SCORE = {
    "Dairy": 65,
    "Kirana": 50,
    "Tailoring": 55,
    "Food Processing": 55,
    "Repair Shop": 48,
}

PURCHASING_POWER_SCORE = {
    "low": -8, "low-medium": -3, "medium": 0, "medium-high": 5, "high": 10,
}

LIVESTOCK_RELEVANCE = {"Dairy": True, "Food Processing": True}


def _category_competitor_count(geoContext, businessCategory: str) -> int:
    """
    Mirrors competitor_mapping.py and risk.py: counts only businesses in the
    SAME category, so viability's competition penalty, the competitor map,
    and the risk section all agree on the same number for a given report.
    """
    village_record = find_village(geoContext.village) if geoContext.village else None
    if village_record:
        return len([
            b for b in village_record.get("existingBusinesses", [])
            if b["category"].lower() == businessCategory.lower()
        ])
    return geoContext.existingBusinessDensity  # fallback when no exact record exists


def compute_score(geoContext, businessCategory: str) -> int:
    score = BUSINESS_BASE_SCORE.get(businessCategory, 45)
    score += PURCHASING_POWER_SCORE.get(geoContext.purchasingPowerIndex, 0)

    # Livestock activity boosts livestock-relevant businesses specifically
    if LIVESTOCK_RELEVANCE.get(businessCategory) and geoContext.livestockIndex in ("medium", "high"):
        score += 12 if geoContext.livestockIndex == "high" else 6

    # Competitor density penalty — uses the SAME category-filtered count
    # Modules 3 and 9 report, so no two sections of the same output ever
    # cite different competitor numbers for the same business category.
    competitor_count = _category_competitor_count(geoContext, businessCategory)
    density_penalty = min(competitor_count * 4, 20)
    score -= density_penalty

    # Larger consumer base gives more headroom
    if geoContext.consumerBase >= 5000:
        score += 6
    elif geoContext.consumerBase < 2000:
        score -= 6

    # Low-confidence data should pull the score toward a cautious middle,
    # not let an unreliable estimate produce a falsely extreme number
    if geoContext.dataConfidence == "low":
        score = round(score * 0.85 + 50 * 0.15)

    return max(0, min(100, round(score)))


def build_explanation(businessCategory, geoContext, score, label) -> str:
    competitor_count = _category_competitor_count(geoContext, businessCategory)
    reasons = []
    if geoContext.livestockIndex in ("medium", "high") and LIVESTOCK_RELEVANCE.get(businessCategory):
        reasons.append(f"a {geoContext.livestockIndex} local livestock base")
    if geoContext.purchasingPowerIndex in ("medium-high", "high"):
        reasons.append("relatively strong local purchasing power")
    if competitor_count <= 3:
        reasons.append("limited nearby competition")
    elif competitor_count > 7:
        reasons.append("significant existing competition in this category")

    reason_text = ", ".join(reasons) if reasons else "moderate overall local market conditions"
    confidence_note = (
        " (based on limited local data — treat this as a preliminary estimate)"
        if geoContext.dataConfidence == "low" else ""
    )

    return (
        f"{businessCategory} shows {label.lower()} in this area, driven by {reason_text}."
        f"{confidence_note}"
    )


@router.post("/viability", response_model=ViabilityResponse)
def score_viability(payload: ViabilityRequest):
    score = compute_score(payload.geoContext, payload.businessCategory)
    label = "High Potential" if score >= 75 else "Moderate Potential" if score >= 50 else "Low Potential"
    explanation = build_explanation(payload.businessCategory, payload.geoContext, score, label)

    return ViabilityResponse(
        score=score,
        label=label,
        explanation=explanation,
        breakEvenMonths=10 if score >= 75 else 14 if score >= 50 else 20,
        expectedCashFlow=60000 if score >= 75 else 42000 if score >= 50 else 25000,
        drivers=["local_demand", "competition_density", "purchasing_power", "livestock_activity"],
        swot={
            "strengths": [f"Established local demand for {payload.businessCategory.lower()}"] if score >= 50 else ["Low upfront competition"],
            "weaknesses": ["Limited initial working capital"],
            "opportunities": ["Underserved adjacent product lines"],
            "threats": ["Seasonal demand fluctuation", "Input price volatility"],
        },
    )
