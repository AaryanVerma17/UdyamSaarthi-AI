"""
Pydantic request/response models shared across ml_service endpoints.

PHASE 0:
- Adds explicit data provenance.
- Distinguishes identifiable data from estimates.
- Prevents downstream modules from treating missing data as exact data.
"""

from typing import List, Optional, Literal

from pydantic import BaseModel, Field


class Location(BaseModel):
    village: str
    block: Optional[str] = None
    district: str
    state: Optional[str] = None


class DataProvenance(BaseModel):
    source: str = "unknown"
    sourceType: str = "unknown"
    authority: str = "unknown"
    dataYear: Optional[int] = None
    lastUpdated: Optional[str] = None
    geographicPrecision: str = "unknown"
    coverage: str = "unknown"
    completeness: str = "unknown"
    estimated: bool = False
    note: Optional[str] = None


class GeoContext(BaseModel):
    village: Optional[str] = None

    consumerBase: int = Field(
        default=0,
        ge=0,
    )

    purchasingPowerIndex: str = "unknown"

    existingBusinessDensity: int = Field(
        default=0,
        ge=0,
    )

    marketsAndHaats: List[str] = []
    distributionChannels: List[str] = []

    livestockIndex: str = "unknown"

    radiusKm: int = Field(
        default=8,
        ge=1,
    )

    dataConfidence: Literal[
        "low",
        "medium",
        "high",
    ] = "low"

    dataSource: str = "unknown"
    lastUpdated: Optional[str] = None

    provenance: DataProvenance = DataProvenance()

    dataAvailabilityNote: str = (
        "Data availability is limited. "
        "Do not interpret missing observations as zero activity."
    )


class ViabilityRequest(BaseModel):
    geoContext: GeoContext
    businessCategory: str


class ViabilityResponse(BaseModel):
    score: int
    label: str
    explanation: str
    breakEvenMonths: Optional[int] = None
    expectedCashFlow: Optional[float] = None
    drivers: List[str]
    swot: dict

    estimateStatus: Literal[
        "evidence_based",
        "preliminary",
        "insufficient_data",
    ] = "preliminary"

    dataLimitations: List[str] = []


class CompetitorPoint(BaseModel):
    lat: float
    lng: float
    name: str
    category: str


class CompetitorMappingRequest(BaseModel):
    geoContext: GeoContext
    businessCategory: str


class CompetitorMappingResponse(BaseModel):
    count: int = Field(
        default=0,
        ge=0,
    )

    classification: Literal[
        "under_served",
        "moderately_competitive",
        "highly_saturated",
    ]

    points: List[CompetitorPoint] = []

    dataConfidenceNote: str = (
        "Reflects identifiable competitors found using available "
        "data sources. Informal or unlisted businesses may not be captured."
    )

    lastUpdated: Optional[str] = None
    identifiable: bool = False
    estimated: bool = False
    source: str = "unknown"
    coverage: str = "unknown"


class OpportunityRequest(BaseModel):
    geoContext: GeoContext
    ownCapital: float
    requestedBusiness: str


class OpportunityItem(BaseModel):
    business: str
    score: int

    classification: Optional[
        Literal[
            "under_served",
            "moderately_competitive",
            "highly_saturated",
        ]
    ] = None

    evidenceStatus: str = "preliminary"


class OpportunityResponse(BaseModel):
    requestedBusiness: OpportunityItem
    alternatives: List[OpportunityItem]
    improvementSuggestions: List[str] = []


class RiskItem(BaseModel):
    type: str
    severity: Literal[
        "low",
        "medium",
        "high",
    ]
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

    confidence: Literal[
        "low",
        "medium",
        "high",
    ]

    basedOn: List[str]
    lastUpdated: Optional[str] = None
    estimated: bool = False
    sourceType: str = "unknown"


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

    language: Literal[
        "hi",
        "en",
    ] = "en"


class ExplainResponse(BaseModel):
    language: str
    text: str

    finalRecommendation: Literal[
        "proceed",
        "proceed_with_caution",
        "not_recommended",
    ]