"""
Population estimation utilities.

Important:
Interpolation is a MODEL ESTIMATE derived from available
reference-year data.

It is NOT an official Census observation.

The result must therefore always expose:
    - source year
    - target year
    - growth assumption
    - estimate status
"""

from typing import Optional


def linear_interpolate(
    base_population: float,
    base_year: int,
    target_year: int,
    growth_rate: Optional[float] = None,
) -> dict:
    """
    Produce an explicitly labelled population estimate.

    Parameters
    ----------
    base_population:
        Population from the available reference year.

    base_year:
        Year of the observed reference population.

    target_year:
        Desired target year.

    growth_rate:
        Annual decimal growth assumption.

        Example:
            0.012 = 1.2% annual growth

    Returns
    -------
    dict

    If target_year == base_year:
        The result is an observed value.

    If target_year > base_year:
        The result is explicitly labelled as a model estimate.
    """

    if base_population < 0:
        raise ValueError(
            "base_population cannot be negative"
        )

    if base_year < 0:
        raise ValueError(
            "base_year must be a valid year"
        )

    if target_year < 0:
        raise ValueError(
            "target_year must be a valid year"
        )

    if target_year < base_year:
        raise ValueError(
            "target_year cannot precede base_year"
        )

    # ---------------------------------------------------------
    # Same year = observed value
    # ---------------------------------------------------------
    if target_year == base_year:
        return {
            "population": round(
                base_population
            ),
            "year": target_year,
            "type": "observed",
            "sourceYear": base_year,
            "isEstimate": False,
        }

    # ---------------------------------------------------------
    # Future target year requires an explicit assumption.
    # ---------------------------------------------------------
    if growth_rate is None:
        raise ValueError(
            "growth_rate is required for interpolation"
        )

    if growth_rate <= -1:
        raise ValueError(
            "growth_rate must be greater than -1"
        )

    years = target_year - base_year

    estimated_population = (
        base_population
        * ((1 + growth_rate) ** years)
    )

    return {
        "population": round(
            estimated_population
        ),
        "year": target_year,
        "type": "model_estimate",
        "sourceYear": base_year,
        "growthRate": growth_rate,
        "isEstimate": True,
        "note": (
            "Estimated from the available "
            "reference-year population. "
            "This is not an official Census "
            "observation."
        ),
    }