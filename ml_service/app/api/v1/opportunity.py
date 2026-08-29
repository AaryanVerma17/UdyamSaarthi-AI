"""
Module 4 — Opportunity Finder (+ Business Improvement/Diversification step)
Scores the requested business plus alternatives. Per the team's meeting
notes, a saturated business is NOT rejected outright — improvement/
differentiation suggestions are offered first, and alternatives are only
emphasized if the business still looks weak after improvements.
"""
from fastapi import APIRouter
from app.schemas.models import OpportunityRequest, OpportunityResponse, OpportunityItem

router = APIRouter()

ALTERNATIVE_POOL = {
    "Dairy": [("Dairy Feed Distribution", 84), ("Tailoring", 78), ("Food Processing", 74)],
    "Kirana": [("Dairy Feed Distribution", 80), ("Tailoring", 76), ("Repair Shop", 70)],
}

IMPROVEMENT_SUGGESTIONS = {
    "Dairy": ["Home delivery subscription", "Paneer/curd/ghee value-addition", "Cattle feed side-line"],
    "Kirana": ["Home delivery for bulk orders", "Stock underserved daily-need SKUs", "Loyalty/subscription model"],
}


@router.post("/opportunities", response_model=OpportunityResponse)
def rank_opportunities(payload: OpportunityRequest):
    requested_score = 68  # TODO: pull from the viability model's score for consistency
    alternatives_raw = ALTERNATIVE_POOL.get(
        payload.requestedBusiness, [("Tailoring", 75), ("Food Processing", 70)]
    )
    alternatives = [OpportunityItem(business=name, score=score) for name, score in alternatives_raw]

    improvement_suggestions = IMPROVEMENT_SUGGESTIONS.get(
        payload.requestedBusiness,
        ["Differentiate via home delivery", "Target an underserved local customer segment"],
    )

    return OpportunityResponse(
        requestedBusiness=OpportunityItem(business=payload.requestedBusiness, score=requested_score),
        alternatives=sorted(alternatives, key=lambda x: x.score, reverse=True),
        improvementSuggestions=improvement_suggestions,
    )
