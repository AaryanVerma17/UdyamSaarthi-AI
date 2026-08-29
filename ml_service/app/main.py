"""
UdyamSaarthi-AI — ML/NLP Microservice (FastAPI)
Serves Modules 1-4, 9-10, and the AI Advisor explanation endpoint, per
Section 6.7-6.13 of the technical documentation.
"""
from fastapi import FastAPI
from app.api.v1 import (
    location_intelligence,
    viability,
    competitor_mapping,
    opportunity,
    risk,
    pricing,
    nlp_explain,
)

app = FastAPI(
    title="UdyamSaarthi-AI ML Service",
    description="Hyper-Local Business Advisory & Financial Structuring Platform — ML/NLP layer",
    version="1.0.0",
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "udyamsaarthi-ml-service"}


app.include_router(location_intelligence.router, prefix="/api/v1", tags=["Module 1 - Location Intelligence"])
app.include_router(viability.router, prefix="/api/v1", tags=["Module 2 - Business Viability"])
app.include_router(competitor_mapping.router, prefix="/api/v1", tags=["Module 3 - Competitor Mapping"])
app.include_router(opportunity.router, prefix="/api/v1", tags=["Module 4 - Opportunity Finder"])
app.include_router(risk.router, prefix="/api/v1", tags=["Module 9 - Risk Analysis"])
app.include_router(pricing.router, prefix="/api/v1", tags=["Module 10 - Localized Pricing"])
app.include_router(nlp_explain.router, prefix="/api/v1", tags=["AI Advisor - Explanation Only"])
