"""
UdyamSaarthi-AI
Evidence source registry.

This file does NOT fetch external data.

It defines how already-ingested data is classified
and how much trust can be assigned to each source type.
"""

from dataclasses import dataclass
from typing import Dict


OFFICIAL_GOVERNMENT = "official_government"
VERIFIED_LOCAL = "verified_local"
SECONDARY_RESEARCH = "secondary_research"
ASSUMPTION = "assumption"


@dataclass(frozen=True)
class SourceDefinition:
    name: str
    tier: str
    authority_score: int
    description: str


SOURCE_REGISTRY: Dict[str, SourceDefinition] = {
    "census": SourceDefinition(
        name="Census of India",
        tier=OFFICIAL_GOVERNMENT,
        authority_score=100,
        description=(
            "Official population and demographic information "
            "published by the Office of the Registrar General "
            "& Census Commissioner."
        ),
    ),

    "udyam": SourceDefinition(
        name="Udyam Registration",
        tier=OFFICIAL_GOVERNMENT,
        authority_score=95,
        description=(
            "Official MSME registration information. "
            "Represents registered enterprises and does not "
            "constitute a complete census of all businesses."
        ),
    ),

    "asuse": SourceDefinition(
        name="Annual Survey of Unincorporated Sector Enterprises",
        tier=OFFICIAL_GOVERNMENT,
        authority_score=95,
        description=(
            "Official statistical survey covering the "
            "unincorporated non-agricultural sector. "
            "Survey estimates should not be interpreted "
            "as a complete local business listing."
        ),
    ),

    "government_market": SourceDefinition(
        name="Government market / mandi data",
        tier=OFFICIAL_GOVERNMENT,
        authority_score=95,
        description=(
            "Officially published market or mandi information "
            "where available."
        ),
    ),

    "verified_local": SourceDefinition(
        name="Verified local field data",
        tier=VERIFIED_LOCAL,
        authority_score=85,
        description=(
            "Recent field-verified information supplied through "
            "an approved local verification process."
        ),
    ),

    "research": SourceDefinition(
        name="Research / secondary source",
        tier=SECONDARY_RESEARCH,
        authority_score=65,
        description=(
            "Research or secondary datasets used when stronger "
            "local evidence is unavailable."
        ),
    ),

    "seed_demo_v1": SourceDefinition(
        name="Seed demonstration dataset",
        tier=ASSUMPTION,
        authority_score=20,
        description=(
            "Demonstration data used for development/testing. "
            "Must not be represented as verified local reality."
        ),
    ),

    "estimated": SourceDefinition(
        name="Model estimate",
        tier=ASSUMPTION,
        authority_score=10,
        description=(
            "Derived estimate used when direct evidence "
            "is unavailable."
        ),
    ),
}


def get_source_definition(source: str) -> SourceDefinition:
    """
    Return source metadata.

    Unknown sources are deliberately treated conservatively.
    """

    normalized = (source or "").strip().lower()

    return SOURCE_REGISTRY.get(
        normalized,
        SourceDefinition(
            name=source or "Unknown source",
            tier=SECONDARY_RESEARCH,
            authority_score=40,
            description="Source not present in the registry.",
        ),
    )