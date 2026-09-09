"""
Pydantic request/response models shared across ml_service endpoints.

Phase 5 additions
-----------------
- CompetitionContext
- category-specific competition
- nullable competitor count
- data_unavailable competition classification
- viability evidence status and limitations

Important:
None for competitor count means "data unavailable",
not "zero competitors".
"""

from typing import (
    Any,
    Dict,
    List,
    Optional,
    Literal,
)

from pydantic import (
    BaseModel,
    Field,
)


# ---------------------------------------------------------------------------
# Common types
# ---------------------------------------------------------------------------

ConfidenceLevel = Literal[
    "low",
    "medium",
    "high",
]


CompetitionClassification = Literal[
    "under_served",
    "moderately_competitive",
    "highly_saturated",
    "data_unavailable",
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
# Provenance
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Evidence
# ---------------------------------------------------------------------------

class EvidenceItem(BaseModel):
    metric: str

    value: Any = None

    source: str = "unknown"

    sourceKey: str = "unknown"

    sourceTier: str = "assumption"

    authorityScore: int = 0

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
    metric: str

    value: Any = None

    source: str = "unknown"

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
# Phase 5 competition context
# ---------------------------------------------------------------------------

class CompetitionContext(BaseModel):
    """
    Category-specific competition passed to downstream modules.
    """

    businessCategory: str

    identifiable: bool = False

    count: Optional[int] = None

    classification: CompetitionClassification = (
        "data_unavailable"
    )

    confidence: ConfidenceLevel = "low"

    source: Optional[str] = None

    sourceTier: Optional[str] = None

    coverage: str = "unknown"

    geographicMatch: str = "unknown"

    dataConfidenceNote: Optional[str] = None


# ---------------------------------------------------------------------------
# Geo context
# ---------------------------------------------------------------------------

class GeoContext(BaseModel):
    village: Optional[str] = None

    block: Optional[str] = None

    district: Optional[str] = None

    state: Optional[str] = None

    # Existing compatibility fields.
    #
    # These remain numeric for backward compatibility.
    # Missing data is communicated through evidence,
    # dataLimitations and dataAvailabilityNote.
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

    provenance: DataProvenance = Field(
        default_factory=DataProvenance
    )

    evidence: Dict[str, EvidenceItem] = Field(
        default_factory=dict
    )

    dataLimitations: List[str] = Field(
        default_factory=list
    )

    dataAvailabilityNote: str = (
        "Data availability is limited. "
        "Do not interpret missing observations "
        "as zero activity."
    )

    isExactLocationMatch: bool = False

    # Phase 4 population metadata.
    populationYear: Optional[int] = None

    populationIsEstimate: bool = False

    governmentDataAvailable: bool = False

    registeredBusinessCount: Optional[int] = None

    informalBusinessEstimateAvailable: bool = False

    # Phase 5.
    competition: Optional[
        CompetitionContext
    ] = None


# ---------------------------------------------------------------------------
# Viability
# ---------------------------------------------------------------------------

class ViabilityRequest(BaseModel):
    geoContext: GeoContext

    businessCategory: str


class ViabilityResponse(BaseModel):
    score: int = Field(
        default=0,
        ge=0,
        le=100,
    )

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
        "evidence_supported",
        "partially_evidence_supported",
        "planning_estimate",
    ] = "preliminary"

    dataLimitations: List[str] = Field(
        default_factory=list
    )

    # Phase 5 / dynamic viability compatibility.
    signals: Dict[str, float] = Field(
        default_factory=dict
    )

    weights: Dict[str, float] = Field(
        default_factory=dict
    )

    limitations: List[str] = Field(
        default_factory=list
    )

    competition: Dict[str, Any] = Field(
        default_factory=dict
    )

    businessEconomics: Dict[str, Any] = Field(
        default_factory=dict
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
    """
    None means:
        competition evidence unavailable.

    It does NOT mean:
        zero competitors.
    """

    count: Optional[int] = None

    classification: CompetitionClassification

    points: List[CompetitorPoint] = Field(
        default_factory=list
    )

    identifiable: bool = False

    category: Optional[str] = None

    radiusKm: int = 8

    source: Optional[str] = None

    sourceTier: Optional[str] = None

    dataYear: Optional[int] = None

    coverage: str = "unknown"

    geographicMatch: str = "unknown"

    confidence: ConfidenceLevel = "low"

    radiusValidated: bool = False

    deduplicatedCount: int = 0

    dataConfidenceNote: str = (
        "Competition reflects identifiable "
        "businesses found using available data. "
        "Informal or unlisted businesses may "
        "not be captured."
    )

    lastUpdated: Optional[str] = None


# ---------------------------------------------------------------------------
# Opportunities
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

    alternatives: List[
        OpportunityItem
    ]

    improvementSuggestions: List[str] = Field(
        default_factory=list
    )


# ---------------------------------------------------------------------------
# Risks
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

    basedOn: List[str]

    lastUpdated: Optional[str] = None

    estimated: bool = False

    sourceType: str = "unknown"

    sourceTier: str = "unknown"

    authorityScore: int = 0

    dataYear: Optional[int] = None

    geographicMatch: str = "unknown"

    coverage: str = "unknown"

    isAssumption: bool = False


# ---------------------------------------------------------------------------
# Explanation
# ---------------------------------------------------------------------------

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