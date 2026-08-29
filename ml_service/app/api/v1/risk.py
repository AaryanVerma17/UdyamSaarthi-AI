"""
Module 9 — Risk Analysis
Rule-based today; upgrade to the rule+ML hybrid classifier (Kavya) later.
Framed constructively per the technical documentation — preparedness, not
discouragement.
"""
from fastapi import APIRouter
from app.schemas.models import RiskRequest, RiskResponse, RiskItem

router = APIRouter()

COMMON_RISKS = {
    "Dairy": [
        RiskItem(type="seasonal_demand", severity="medium", description="Milk demand dips in certain seasons.", mitigation="Diversify into paneer/ghee to smooth revenue year-round."),
        RiskItem(type="input_availability", severity="medium", description="Fodder price volatility affects margins.", mitigation="Negotiate multi-month fodder supply contracts."),
        RiskItem(type="single_buyer_dependency", severity="high", description="Reliance on one cooperative/buyer.", mitigation="Diversify distribution channels (local haat + direct retail)."),
    ],
}

DEFAULT_RISKS = [
    RiskItem(type="competition", severity="medium", description="Existing businesses in the same category nearby.", mitigation="Differentiate on service, quality, or delivery."),
    RiskItem(type="price_volatility", severity="low", description="Input costs may fluctuate.", mitigation="Maintain a small reserve fund for cost shocks."),
]


@router.post("/risks", response_model=RiskResponse)
def analyze_risks(payload: RiskRequest):
    risks = COMMON_RISKS.get(payload.businessCategory, DEFAULT_RISKS)
    return RiskResponse(risks=risks)
