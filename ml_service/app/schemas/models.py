"""
UdyamSaarthi-AI — Pydantic models shared across ML service endpoints.

Phase 3:
- Preserves existing endpoint contracts.
- Adds explicit evidence/provenance metadata.
- Distinguishes observed/identifiable data from estimates.
- Prevents missing data from being interpreted as factual zero.
"""

from typing import Any, Dict, List, Optional, Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Common types
# ---------------------------------------------------------------------------

ConfidenceLevel = Literal["low", "medium", "high"]

CompetitionClassification = Literal[
    "under_served",
    "moderately_competitive",
    "highly_saturated",
]


# ---------------------------------------------------------------------------
# Location
# ---------------------------------------------------------------------------

class Location(BaseModel):
    village: str
    block: Optional[str] = None
    district: str
    state: Optional[str] = None


# ---------------------------------------------------------------------------
# Evidence / provenance
# ---------------------------------------------------------------------------

class DataProvenance(BaseModel):
    """
    Provenance metadata for the location-level dataset.

    These fields describe where the evidence came from and how reliable
    the geographic/data coverage is. They do NOT imply that the underlying
    value is complete merely because the record exists.
    """

    source: str = "unknown"

    # Human-readable source classification.
    # Examples: official, verified_local, secondary, assumption,
    # unavailable, local_dataset.
    sourceType: str = "unknown"

    # Authority descriptor or numeric authority may be represented by
    # downstream services. Keep this flexible for backwards compatibility.
    authority: Any = "unknown"

    dataYear: Optional[int] = None
    lastUpdated: Optional[str] = None

    geographicPrecision: str = "unknown"
    coverage: str = "unknown"
    completeness: str = "unknown"

    estimated: bool = False

    note: Optional[str] = None


class EvidenceItem(BaseModel):
    """
    Metric-level evidence.

    Used by Phase 3 so every important location metric can carry its own
    provenance instead of relying only on one overall confidence value.
    """

    metric: str
    value: Any

    source: str = "unknown"
    sourceKey: str = "unknown"
    sourceTier: str = "assumption"
    authorityScore: int = 10

    dataYear: Optional[int] = None
    lastUpdated: Optional[str] = None

    geographicMatch: str = "unknown"
    coverage: str = "unknown"

    confidence: ConfidenceLevel = "low"

    isAssumption: bool = False

    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Location intelligence
# ---------------------------------------------------------------------------

class GeoContext(BaseModel):
    """
    Location intelligence returned by Module 1.

    IMPORTANT:
    consumerBase=0 or existingBusinessDensity=0 can mean that the value
    is unavailable. Downstream modules must check confidence/provenance
    before interpreting zero as actual activity.
    """

    village: Optional[str] = None
    block: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None

    consumerBase: int = Field(
        default=0,
        ge=0,
    )

    purchasingPowerIndex: str = "unknown"

    existingBusinessDensity: int = Field(
        default=0,
        ge=0,
    )

    marketsAndHaats: List[str] = Field(
        default_factory=list
    )

    distributionChannels: List[str] = Field(
        default_factory=list
    )

    livestockIndex: str = "unknown"

    radiusKm: int = Field(
        default=8,
        ge=1,
    )

    dataConfidence: ConfidenceLevel = "low"

    dataSource: str = "unknown"

    lastUpdated: Optional[str] = None

    # Phase 3 overall provenance.
    provenance: DataProvenance = Field(
        default_factory=DataProvenance
    )

    # Phase 3 metric-level evidence.
    evidence: Dict[str, EvidenceItem] = Field(
        default_factory=dict
    )

    dataLimitations: List[str] = Field(
        default_factory=list
    )

    dataAvailabilityNote: str = (
        "Data availability is limited. "
        "Do not interpret missing observations as zero activity."
    )

    isExactLocationMatch: bool = False


# ---------------------------------------------------------------------------
# Viability
# ---------------------------------------------------------------------------

class ViabilityRequest(BaseModel):
    geoContext: GeoContext
    businessCategory: str


class ViabilityResponse(BaseModel):
    score: int
    label: str
    explanation: str

    breakEvenMonths: Optional[int] = None
    expectedCashFlow: Optional[float] = None

    drivers: List[str] = Field(
        default_factory=list
    )

    swot: dict = Field(
        default_factory=dict
    )

    estimateStatus: Literal[
        "evidence_based",
        "preliminary",
        "insufficient_data",
    ] = "preliminary"

    dataLimitations: List[str] = Field(
        default_factory=list
    )


# ---------------------------------------------------------------------------
# Competitor mapping
# ---------------------------------------------------------------------------

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

    classification: CompetitionClassification

    points: List[CompetitorPoint] = Field(
        default_factory=list
    )

    # Important user-facing limitation.
    dataConfidenceNote: str = (
        "Reflects identifiable competitors found using available "
        "data sources. Informal or unlisted businesses may not be captured."
    )

    identifiable: bool = False

    # Evidence/provenance fields required by Phase 3.
    estimated: bool = False

    source: str = "unknown"
    sourceType: str = "unknown"
    sourceTier: str = "assumption"

    authorityScore: Optional[int] = None

    dataYear: Optional[int] = None
    lastUpdated: Optional[str] = None

    geographicMatch: str = "unknown"
    coverage: str = "unknown"

    isAssumption: bool = False


# ---------------------------------------------------------------------------
# Opportunity finder
# ---------------------------------------------------------------------------

class OpportunityRequest(BaseModel):
    geoContext: GeoContext
    ownCapital: float
    requestedBusiness: str


class OpportunityItem(BaseModel):
    business: str
    score: int

    classification: Optional[
        CompetitionClassification
    ] = None

    evidenceStatus: str = "preliminary"


class OpportunityResponse(BaseModel):
    requestedBusiness: OpportunityItem

    alternatives: List[OpportunityItem] = Field(
        default_factory=list
    )

    improvementSuggestions: List[str] = Field(
        default_factory=list
    )


# ---------------------------------------------------------------------------
# Risk analysis
# ---------------------------------------------------------------------------

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
    risks: List[RiskItem] = Field(
        default_factory=list
    )


# ---------------------------------------------------------------------------
# Pricing
# ---------------------------------------------------------------------------

class PricingRequest(BaseModel):
    geoContext: GeoContext
    businessCategory: str


class PricingResponse(BaseModel):
    range: List[float]

    unit: str

    confidence: ConfidenceLevel

    basedOn: List[str] = Field(
        default_factory=list
    )

    # Phase 3 provenance.
    sourceType: str = "unknown"
    sourceTier: str = "assumption"

    authorityScore: Optional[int] = None

    dataYear: Optional[int] = None
    lastUpdated: Optional[str] = None

    geographicMatch: str = "unknown"
    coverage: str = "unknown"

    estimated: bool = False
    isAssumption: bool = False


# ---------------------------------------------------------------------------
# AI explanation
# ---------------------------------------------------------------------------

class ExplainRequest(BaseModel):
    """
    AI receives already-computed facts.

    The AI explanation endpoint must not become the source of truth for
    financial, scheme, competition, pricing, or viability calculations.
    """

    businessCategory: str

    viability: dict
    competitorMapping: dict
    opportunities: dict

    financials: dict
    scheme: dict
    repayment: dict
    workingCapital: dict

    risks: Any
    pricing: dict

    language: Literal[
        "hi",
        "en",
    ] = "en"


class ExplainResponse(BaseModel):
    language: str
    text: str

    finalRecommendation: Optional[
        Literal[
            "proceed",
            "proceed_with_caution",
            "not_recommended",
        ]
    ] = None