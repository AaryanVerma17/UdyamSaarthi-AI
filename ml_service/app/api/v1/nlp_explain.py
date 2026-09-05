"""
AI Advisor — Explanation Layer ONLY (Module: nlp_explain) — Aaryan

CRITICAL ARCHITECTURAL CONSTRAINT: this endpoint receives every numeric
fact pre-computed by the deterministic engines and ML models. It must
NEVER invent, alter, or recompute a financial figure, scheme term, or
score — it only phrases and translates what it's given, optionally
grounded with retrieved context from app/rag/vector_store.py.

If ANTHROPIC_API_KEY is set, this calls the real Anthropic API. If not
(e.g. running the scaffold locally without a key), it falls back to the
templated narrative so the pipeline never breaks.
"""
import os
import json
from fastapi import APIRouter
from app.schemas.models import ExplainRequest, ExplainResponse
from app.rag.vector_store import build_context_block

router = APIRouter()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "").strip()


def _derive_recommendation(viability: dict, repayment: dict) -> str:
    score = viability.get("score", 0)
    capacity = repayment.get("repaymentCapacity", "Unknown")
    if score >= 75 and capacity in ("High", "Medium"):
        return "proceed"
    if score >= 50:
        return "proceed_with_caution"
    return "not_recommended"


def _templated_narrative(payload: ExplainRequest, recommendation: str) -> str:
    if payload.language == "hi":
        return (
            f"आपकी परियोजना लागत ₹{payload.financials.get('projectCost'):,.0f} है, "
            f"जिसमें से ₹{payload.financials.get('loanAmount'):,.0f} तक का ऋण "
            f"{payload.scheme.get('name')} के तहत संभव है ({payload.scheme.get('interestRate')}% ब्याज, "
            f"{payload.scheme.get('tenureYears')} वर्ष)। व्यवहार्यता स्कोर "
            f"{payload.viability.get('score')}/100 है। अनुशंसा: {recommendation}."
        )
    return (
        f"Your project cost comes to ₹{payload.financials.get('projectCost'):,.0f}, "
        f"with a potential loan of ₹{payload.financials.get('loanAmount'):,.0f} under the "
        f"{payload.scheme.get('name')} ({payload.scheme.get('interestRate')}% interest, "
        f"{payload.scheme.get('tenureYears')}-year tenure). "
        f"Viability score: {payload.viability.get('score')}/100. "
        f"Recommendation: {recommendation.replace('_', ' ')}."
    )


def _call_anthropic(payload: ExplainRequest, recommendation: str, context_block: str) -> str:
    from anthropic import Anthropic  # imported lazily so the package is only required if a key is set

    client = Anthropic(api_key=ANTHROPIC_API_KEY)

    lang_instruction = "Respond in Hindi." if payload.language == "hi" else "Respond in English."
    system_prompt = (
        "You are a plain-language business advisor explaining a feasibility report "
        "to a first-time rural entrepreneur with no financial background. "
        "You MUST NOT invent, alter, or recompute any number, scheme term, or score — "
        "only explain and contextualize the exact facts given to you. "
        "Avoid financial jargon. Keep the response to 4-6 short sentences. "
        f"{lang_instruction}"
    )

    facts = {
        "viability": payload.viability,
        "financials": payload.financials,
        "scheme": payload.scheme,
        "repayment": payload.repayment,
        "workingCapital": payload.workingCapital,
        "risks": payload.risks,
        "pricing": payload.pricing,
        "computedRecommendation": recommendation,
    }

    user_message = (
        f"Here are the pre-computed facts for this feasibility report:\n"
        f"{json.dumps(facts, ensure_ascii=False)}\n\n"
        f"Relevant background context (for flavor only, not for numbers):\n{context_block}\n\n"
        f"Write the plain-language explanation now."
    )

    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=500,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )
    return "".join(block.text for block in response.content if block.type == "text")


@router.post("/explain", response_model=ExplainResponse)
def explain(payload: ExplainRequest):
    recommendation = _derive_recommendation(payload.viability, payload.repayment)

    risk_types = [r.get("type") for r in (payload.risks.get("risks", []) if isinstance(payload.risks, dict) else payload.risks or [])]
    context_block = build_context_block(payload.businessCategory, risk_types)

    if ANTHROPIC_API_KEY:
        try:
            text = _call_anthropic(payload, recommendation, context_block)
        except Exception as e:  # noqa: BLE001 — never let an LLM outage break the report
            print(f"[nlp_explain] Anthropic call failed, falling back to template: {e}")
            text = _templated_narrative(payload, recommendation)
    else:
        text = _templated_narrative(payload, recommendation)

    return ExplainResponse(language=payload.language, text=text, finalRecommendation=recommendation)
