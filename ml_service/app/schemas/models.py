"""
UdyamSaarthi-AI — Pydantic models shared across ML service endpoints.

Phase 4:
- Preserves existing endpoint contracts.
- Adds explicit evidence/provenance metadata.
- Distinguishes observed/identifiable data from estimates.
- Prevents missing data from being interpreted as factual zero.
- Adds population vintage and government-data availability metadata.
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
    Provenance metadata for location-level evidence.

    These fields describe where the evidence came from and how reliable
    the geographic/data coverage is.
    """

    source: str = "unknown"

    # Examples:
    # official
    # verified_local
    # secondary
    # assumption
    # unavailable
    # local_dataset
    sourceType: str = "unknown"

    # Can be a descriptor or numeric authority score.
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

    Each important location metric can carry its own provenance rather
    than relying only on one overall confidence value.
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
# Phase 4 location evidence
# ---------------------------------------------------------------------------

class LocationEvidence(BaseModel):
    """
    Standardized Phase 4 evidence object for a location metric.

    This is intentionally separate from the older EvidenceItem contract
    so Phase 4 can expose a richer normalized evidence structure while
    existing endpoint consumers remain compatible.
    """

    metric: str
    value: Any

    source: str
    sourceKey: str = "unknown"
    sourceTier: str = "assumption"

    dataYear: Optional[int] = None
    lastUpdated: Optional[str] = None

    geographicMatch: str = "unknown"
    coverage: str = "unknown"

    confidence: ConfidenceLevel = "low"

    isEstimate: bool = False
    isAssumption: bool = False

    note: Optional[str] = None


# ---------------------------------------------------------------------------
# Location intelligence
# ---------------------------------------------------------------------------

class GeoContext(BaseModel):
    """
    Location intelligence returned by Module 1.

    IMPORTANT:

    None means reliable evidence is unavailable.

    A missing observation must NOT be interpreted as zero consumers,
    zero businesses, or zero market activity.
    """

    village: Optional[str] = None
    block: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None

    # -----------------------------------------------------------------------
    # Core location metrics
    # -----------------------------------------------------------------------

    consumerBase: Optional[int] = Field(
        default=None,
        ge=0,
    )

    purchasingPowerIndex: str = "unknown"

    existingBusinessDensity: Optional[int] = Field(
        default=None,
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

    # -----------------------------------------------------------------------
    # Confidence / source metadata
    # -----------------------------------------------------------------------

    dataConfidence: ConfidenceLevel = "low"

    dataSource: str = "unknown"

    lastUpdated: Optional[str] = None

    # Overall provenance from Phase 3.
    provenance: DataProvenance = Field(
        default_factory=DataProvenance
    )

    # Existing Phase 3 metric-level evidence.
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

    # -----------------------------------------------------------------------
    # Phase 4 population / government data metadata
    # -----------------------------------------------------------------------

    populationYear: Optional[int] = None

    # True only when population is derived/estimated rather than directly
    # observed for the stated population year.
    populationIsEstimate: bool = False

    governmentDataAvailable: bool = False

    # Registered enterprise count from a government registry such as Udyam.
    # Do NOT infer this from existingBusinessDensity.
    registeredBusinessCount: Optional[int] = Field(
        default=None,
        ge=0,
    )

    informalBusinessEstimateAvailable: bool = False


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

    # Evidence/provenance fields.
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

    # Phase 3/4 provenance.
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