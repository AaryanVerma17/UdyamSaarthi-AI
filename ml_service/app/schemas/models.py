"""
Pydantic request/response models shared across ml_service endpoints.
These mirror the exact contracts from the technical documentation
(§6.7-6.13 / §14.7 / Appendix C) so the Node.js server can rely on a
stable shape while the underlying logic is swapped from mock -> real
ML models over the sprints.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel


class Location(BaseModel):
    village: str
    block: Optional[str] = None
    district: str
    state: Optional[str] = None


class GeoContext(BaseModel):
    village: Optional[str] = None
    consumerBase: int
    purchasingPowerIndex: str
    existingBusinessDensity: int
    marketsAndHaats: List[str]
    distributionChannels: List[str]
    livestockIndex: str
    radiusKm: int = 8
    dataConfidence: Literal["low", "medium", "high"] = "medium"
    dataSource: str = "mock_v1"
    lastUpdated: Optional[str] = None


class ViabilityRequest(BaseModel):
    geoContext: GeoContext
    businessCategory: str


class ViabilityResponse(BaseModel):
    score: int
    label: str
    explanation: str
    breakEvenMonths: int
    expectedCashFlow: float
    drivers: List[str]
    swot: dict


class CompetitorPoint(BaseModel):
    lat: float
    lng: float
    name: str
    category: str


class CompetitorMappingRequest(BaseModel):
    geoContext: GeoContext
    businessCategory: str


class CompetitorMappingResponse(BaseModel):
    count: int
    classification: Literal["under_served", "moderately_competitive", "highly_saturated"]
    points: List[CompetitorPoint]
    dataConfidenceNote: str = "Reflects identifiable competitors found using available data sources; informal/unlisted businesses may not be captured."
    lastUpdated: Optional[str] = None


class OpportunityRequest(BaseModel):
    geoContext: GeoContext
    ownCapital: float
    requestedBusiness: str


class OpportunityItem(BaseModel):
    business: str
    score: int
    classification: Optional[Literal["under_served", "moderately_competitive", "highly_saturated"]] = None


class OpportunityResponse(BaseModel):
    requestedBusiness: OpportunityItem
    alternatives: List[OpportunityItem]
    improvementSuggestions: List[str] = []


class RiskItem(BaseModel):
    type: str
    severity: Literal["low", "medium", "high"]
    description: str
    mitigation: str


class RiskRequest(BaseModel):
    geoContext: GeoContext
    businessCategory: str


class RiskResponse(BaseModel):
    risks: List[RiskItem]


class PricingRequest(BaseModel):
    geoContext: GeoContext
    businessCategory: str


class PricingResponse(BaseModel):
    range: List[float]
    unit: str
    confidence: Literal["low", "medium", "high"]
    basedOn: List[str]
    lastUpdated: Optional[str] = None


class ExplainRequest(BaseModel):
    businessCategory: str
    viability: dict
    competitorMapping: dict
    opportunities: dict
    financials: dict
    scheme: dict
    repayment: dict
    workingCapital: dict
    risks: object
    pricing: dict
    language: Literal["hi", "en"] = "en"


class ExplainResponse(BaseModel):
    language: str
    text: str
    finalRecommendation: Literal["proceed", "proceed_with_caution", "not_recommended"]
