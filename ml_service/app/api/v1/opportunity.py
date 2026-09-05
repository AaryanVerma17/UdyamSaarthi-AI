"""
Module 4 — Opportunity Finder (+ Business Improvement/Diversification step)

Real implementation: re-runs the SAME viability scoring function
(viability.compute_score) against every candidate business category for
this location, so Module 4's numbers are always consistent with Module 2 —
no separately-maintained hardcoded score tables that can drift apart.

DEPENDENCY FIX (per architecture review): candidate alternatives are now
filtered against Module 3's OWN classify() function per category BEFORE
ranking. An alternative that would itself classify as "highly_saturated"
is excluded outright — otherwise server/src/services/recommendationGate.js
could end up promoting a saturated alternative right after gating the
user's original saturated choice, which defeats the point of the gate.

Per the team's meeting notes, a saturated REQUESTED business is NOT
rejected outright — improvement/differentiation suggestions are surfaced
alongside alternatives, not instead of validating the user's original
choice. That behavior is unchanged; only the alternatives list is now
saturation-filtered.
"""
from fastapi import APIRouter
from app.schemas.models import OpportunityRequest, OpportunityResponse, OpportunityItem
from app.api.v1.viability import compute_score, BUSINESS_BASE_SCORE
from app.api.v1.competitor_mapping import classify as classify_competition
from app.data_access.villages import find_village

router = APIRouter()

ALL_CATEGORIES = list(BUSINESS_BASE_SCORE.keys())

IMPROVEMENT_SUGGESTIONS = {
    "Dairy": ["Home delivery subscription", "Paneer/curd/ghee value-addition", "Cattle feed side-line"],
    "Kirana": ["Home delivery for bulk orders", "Stock underserved daily-need SKUs", "Loyalty/subscription model"],
    "Tailoring": ["Uniform/bulk institutional contracts", "Alteration + rental services", "Online measurement booking"],
    "Food Processing": ["Direct-to-consumer packaging", "Local restaurant supply contracts", "Value-added product lines"],
    "Repair Shop": ["Home-visit repair service", "Annual maintenance contracts", "Spare-parts side inventory"],
}


def _classification_for_category(geoContext, category: str) -> str:
    """
    Mirrors competitor_mapping.map_competitors()'s counting logic exactly,
    then reuses its classify() thresholds — so Module 4 can never disagree
    with Module 3 about which categories are saturated.
    """
    village_record = find_village(geoContext.village) if geoContext.village else None
    if village_record:
        count = len([
            b for b in village_record.get("existingBusinesses", [])
            if b["category"].lower() == category.lower()
        ])
    else:
        count = geoContext.existingBusinessDensity  # fallback, same as competitor_mapping's own fallback
    return classify_competition(count)


@router.post("/opportunities", response_model=OpportunityResponse)
def rank_opportunities(payload: OpportunityRequest):
    requested_score = compute_score(payload.geoContext, payload.requestedBusiness)
    requested_classification = _classification_for_category(payload.geoContext, payload.requestedBusiness)

    candidates = []
    for category in ALL_CATEGORIES:
        if category == payload.requestedBusiness:
            continue

        classification = _classification_for_category(payload.geoContext, category)
        if classification == "highly_saturated":
            # Excluded outright — never let the gate downstream promote an
            # alternative that is itself saturated. This is the fix the
            # dependency review flagged.
            continue

        candidates.append(OpportunityItem(
            business=category,
            score=compute_score(payload.geoContext, category),
            classification=classification,
        ))

    candidates.sort(key=lambda x: x.score, reverse=True)

    improvement_suggestions = IMPROVEMENT_SUGGESTIONS.get(
        payload.requestedBusiness,
        ["Differentiate via home delivery", "Target an underserved local customer segment"],
    )

    return OpportunityResponse(
        requestedBusiness=OpportunityItem(
            business=payload.requestedBusiness,
            score=requested_score,
            classification=requested_classification,
        ),
        alternatives=candidates[:3],
        improvementSuggestions=improvement_suggestions,
    )
