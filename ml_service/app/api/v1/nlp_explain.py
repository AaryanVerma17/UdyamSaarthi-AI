"""
AI Advisor — Explanation Layer ONLY (Module: nlp_explain)

CRITICAL ARCHITECTURAL CONSTRAINT: this endpoint receives every numeric
fact pre-computed by the deterministic engines and ML models. It must
NEVER invent, alter, or recompute a financial figure, scheme term, or
score — it only phrases and translates what it's given.

This mock implementation builds a templated narrative without calling an
external LLM, so the whole pipeline runs with zero API keys configured.
Wire in a real Anthropic/OpenAI call here when ready — the function
signature and response contract should not need to change.
"""
from fastapi import APIRouter
from app.schemas.models import ExplainRequest, ExplainResponse

router = APIRouter()


def _derive_recommendation(viability: dict, repayment: dict) -> str:
    score = viability.get("score", 0)
    capacity = repayment.get("repaymentCapacity", "Unknown")
    if score >= 75 and capacity in ("High", "Medium"):
        return "proceed"
    if score >= 50:
        return "proceed_with_caution"
    return "not_recommended"


@router.post("/explain", response_model=ExplainResponse)
def explain(payload: ExplainRequest):
    recommendation = _derive_recommendation(payload.viability, payload.repayment)

    if payload.language == "hi":
        text = (
            f"आपकी परियोजना लागत ₹{payload.financials.get('projectCost'):,.0f} है, "
            f"जिसमें से ₹{payload.financials.get('loanAmount'):,.0f} तक का ऋण "
            f"{payload.scheme.get('name')} के तहत संभव है ({payload.scheme.get('interestRate')}% ब्याज, "
            f"{payload.scheme.get('tenureYears')} वर्ष)। व्यवहार्यता स्कोर "
            f"{payload.viability.get('score')}/100 है। अनुशंसा: {recommendation}."
        )
    else:
        text = (
            f"Your project cost comes to ₹{payload.financials.get('projectCost'):,.0f}, "
            f"with a potential loan of ₹{payload.financials.get('loanAmount'):,.0f} under the "
            f"{payload.scheme.get('name')} ({payload.scheme.get('interestRate')}% interest, "
            f"{payload.scheme.get('tenureYears')}-year tenure). "
            f"Viability score: {payload.viability.get('score')}/100. "
            f"Recommendation: {recommendation.replace('_', ' ')}."
        )

    return ExplainResponse(language=payload.language, text=text, finalRecommendation=recommendation)
