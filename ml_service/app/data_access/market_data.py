"""
UdyamSaarthi-AI
Government data adapter layer.

This module does NOT scrape websites and does NOT invent APIs.

It provides a common interface for already-ingested government
datasets such as:

- Census
- Udyam/MSME
- ASUSE

Actual official datasets can be connected to these adapters
without changing the location-intelligence layer.
"""

from typing import Any, Dict, List, Optional


class GovernmentDataProvider:
    """
    Common interface for government datasets.

    Implementations should consume normalized records that have
    already been downloaded/ingested through an approved source.
    """

    name = "base"

    def find_location(
        self,
        village: str,
        block: Optional[str],
        district: str,
        state: Optional[str],
    ) -> Optional[Dict[str, Any]]:
        raise NotImplementedError


class CensusProvider(GovernmentDataProvider):
    """
    Census population provider.

    The provider reads normalized Census records.

    Important:
    - A historical Census observation remains an observation.
    - It must not be relabelled as Census 2027.
    - Future Census releases can be ingested into the same contract.
    """

    name = "census"

    def __init__(
        self,
        records: Optional[List[Dict[str, Any]]] = None,
    ):
        self.records = records or []

    def find_location(
        self,
        village: str,
        block: Optional[str],
        district: str,
        state: Optional[str],
    ) -> Optional[Dict[str, Any]]:

        target_village = str(village or "").strip().lower()
        target_block = str(block or "").strip().lower()
        target_district = str(district or "").strip().lower()
        target_state = str(state or "").strip().lower()

        matches: List[Dict[str, Any]] = []

        for record in self.records:
            record_village = (
                str(record.get("village", ""))
                .strip()
                .lower()
            )

            record_district = (
                str(record.get("district", ""))
                .strip()
                .lower()
            )

            if record_village != target_village:
                continue

            if record_district != target_district:
                continue

            if state and record.get("state"):
                record_state = (
                    str(record["state"])
                    .strip()
                    .lower()
                )

                if record_state != target_state:
                    continue

            if block and record.get("block"):
                record_block = (
                    str(record["block"])
                    .strip()
                    .lower()
                )

                if record_block != target_block:
                    continue

            matches.append(record)

        if not matches:
            return None

        # Prefer the newest available observation.
        matches.sort(
            key=lambda item: (
                item.get("dataYear") or 0
            ),
            reverse=True,
        )

        return matches[0]


class UdyamProvider(GovernmentDataProvider):
    """
    Udyam/MSME registration provider.

    Udyam represents registered enterprises only.

    It must NEVER be interpreted as the total number of
    businesses operating in a locality.
    """

    name = "udyam"

    def __init__(
        self,
        records: Optional[List[Dict[str, Any]]] = None,
    ):
        self.records = records or []

    def find_location(
        self,
        village: str,
        block: Optional[str],
        district: str,
        state: Optional[str],
    ) -> Optional[Dict[str, Any]]:

        target_district = (
            str(district or "")
            .strip()
            .lower()
        )

        target_state = (
            str(state or "")
            .strip()
            .lower()
        )

        matches: List[Dict[str, Any]] = []

        for record in self.records:
            record_district = (
                str(record.get("district", ""))
                .strip()
                .lower()
            )

            if record_district != target_district:
                continue

            if state and record.get("state"):
                record_state = (
                    str(record["state"])
                    .strip()
                    .lower()
                )

                if record_state != target_state:
                    continue

            matches.append(record)

        if not matches:
            return None

        registered_count = 0

        for record in matches:
            try:
                registered_count += int(
                    record.get(
                        "registeredCount",
                        0,
                    )
                    or 0
                )
            except (TypeError, ValueError):
                continue

        years = [
            record.get("dataYear")
            for record in matches
            if record.get("dataYear") is not None
        ]

        return {
            "registeredCount": registered_count,
            "source": "udyam",
            "coverage": "registered_enterprises",
            "dataYear": max(years) if years else None,
        }


class ASUSEProvider(GovernmentDataProvider):
    """
    ASUSE adapter.

    ASUSE is survey-based.

    Therefore it should be treated as a statistical signal
    for the informal/unincorporated sector and NOT as an exact
    local business count.
    """

    name = "asuse"

    def __init__(
        self,
        records: Optional[List[Dict[str, Any]]] = None,
    ):
        self.records = records or []

    def find_location(
        self,
        village: str,
        block: Optional[str],
        district: str,
        state: Optional[str],
    ) -> Optional[Dict[str, Any]]:

        target_district = (
            str(district or "")
            .strip()
            .lower()
        )

        target_state = (
            str(state or "")
            .strip()
            .lower()
        )

        for record in self.records:
            record_district = (
                str(record.get("district", ""))
                .strip()
                .lower()
            )

            if record_district != target_district:
                continue

            if state and record.get("state"):
                record_state = (
                    str(record["state"])
                    .strip()
                    .lower()
                )

                if record_state != target_state:
                    continue

            return record

        return None