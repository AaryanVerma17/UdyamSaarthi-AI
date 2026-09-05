"""
Module 9 — Risk Analysis

Real implementation: rule-based severity computed from actual GeoContext
signals (not a static hardcoded list per category). E.g. seasonal-demand
severity scales with livestock dependency, competition risk scales with
the same density figure Module 3 reports, so risks stay consistent with
the rest of the report. Framed constructively — preparedness, not
discouragement — per the technical documentation.
"""
from fastapi import APIRouter
from app.schemas.models import RiskRequest, RiskResponse, RiskItem
from app.data_access.villages import find_village

router = APIRouter()

LIVESTOCK_DEPENDENT = {"Dairy", "Food Processing"}
SINGLE_BUYER_PRONE = {"Dairy"}


def _category_competitor_count(geoContext, businessCategory: str) -> int:
    """
    Mirrors competitor_mapping.py's logic exactly: filters to businesses in
    the SAME category, not the village's total business density, so this
    module's risk description never contradicts Module 3's competitor count.
    """
    village_record = find_village(geoContext.village) if geoContext.village else None
    if village_record:
        return len([
            b for b in village_record.get("existingBusinesses", [])
            if b["category"].lower() == businessCategory.lower()
        ])
    return geoContext.existingBusinessDensity  # fallback when no exact record exists


@router.post("/risks", response_model=RiskResponse)
def analyze_risks(payload: RiskRequest):
    geo = payload.geoContext
    risks = []

    if payload.businessCategory in LIVESTOCK_DEPENDENT:
        severity = "high" if geo.livestockIndex == "low" else "medium"
        risks.append(RiskItem(
            type="seasonal_demand",
            severity=severity,
            description="Demand and input availability may fluctuate seasonally for livestock-dependent businesses.",
            mitigation="Diversify into value-added products (e.g. paneer/ghee) to smooth revenue across seasons.",
        ))

    if payload.businessCategory in SINGLE_BUYER_PRONE:
        risks.append(RiskItem(
            type="single_buyer_dependency",
            severity="high",
            description="Reliance on a single cooperative or buyer for the bulk of sales.",
            mitigation="Diversify distribution channels — combine local haat, cooperative, and direct retail sales.",
        ))

    # Competition risk scales with the SAME category-filtered count Module 3 reports
    competitor_count = _category_competitor_count(geo, payload.businessCategory)
    if competitor_count > 7:
        comp_severity = "high"
    elif competitor_count > 3:
        comp_severity = "medium"
    else:
        comp_severity = "low"
    risks.append(RiskItem(
        type="competition",
        severity=comp_severity,
        description=f"{competitor_count} identifiable {payload.businessCategory.lower()} businesses already operate in this area.",
        mitigation="Differentiate on service, delivery, or quality rather than competing purely on price.",
    ))

    # Low data confidence is itself a risk worth surfacing to the user
    if geo.dataConfidence == "low":
        risks.append(RiskItem(
            type="data_confidence",
            severity="medium",
            description="Limited local data is available for this specific village — figures above are estimates.",
            mitigation="Validate demand and pricing directly with local buyers before committing capital.",
        ))

    risks.append(RiskItem(
        type="price_volatility",
        severity="low",
        description="Input costs may fluctuate with broader market conditions.",
        mitigation="Maintain a small reserve fund (see Working Capital allocation) for cost shocks.",
    ))

    return RiskResponse(risks=risks)
