"""
ml_service/app/utils/population_interpolation.py

Implements the "never wait for the literal next census" rule from the
data refresh strategy (see scripts/data_ingestion/README.md). Population
and purchasing-power figures should be interpolated forward annually
using a state-level growth rate, not left frozen at whatever the last
census said until the next one is published — which for Census 2027 may
be years away from full district-level rollout.

Usage:
    from app.utils.population_interpolation import interpolate_population
    current_estimate = interpolate_population(
        base_population=4200, base_year=2011, growth_rate_pct=1.8, target_year=2026
    )
"""
from datetime import date


def interpolate_population(base_population: int, base_year: int, growth_rate_pct: float, target_year: int = None) -> int:
    """
    Simple compound annual growth interpolation:
        estimate = base_population * (1 + growth_rate_pct/100) ^ (target_year - base_year)

    @param base_population: population figure from the base census/survey year
    @param base_year: the year that figure was recorded (e.g. 2011)
    @param growth_rate_pct: annual population growth rate for the state/district (e.g. 1.8 for 1.8%)
    @param target_year: year to interpolate to; defaults to the current year
    @returns: interpolated population estimate for target_year, rounded to the nearest whole person

    Raises ValueError if target_year is before base_year (interpolating
    backward isn't what this function is for) or if growth_rate_pct is
    wildly implausible (a config error is more likely than reality).
    """
    if target_year is None:
        target_year = date.today().year

    if target_year < base_year:
        raise ValueError(f"target_year ({target_year}) cannot be before base_year ({base_year})")

    if not (-5 <= growth_rate_pct <= 15):
        raise ValueError(
            f"growth_rate_pct={growth_rate_pct} is outside a plausible range (-5 to 15) — "
            f"check this isn't a typo (e.g. 18 instead of 1.8) before trusting the result"
        )

    years_elapsed = target_year - base_year
    estimate = base_population * ((1 + growth_rate_pct / 100) ** years_elapsed)
    return round(estimate)


def years_since_last_refresh(last_updated_iso: str, reference_date: date = None) -> float:
    """
    Convenience helper for deciding whether a population figure is due for
    re-interpolation (paired with dataConfidence.js's age-based decay on
    the Node side, but usable standalone here too).
    """
    if reference_date is None:
        reference_date = date.today()
    last_updated = date.fromisoformat(last_updated_iso[:10])
    return (reference_date - last_updated).days / 365.25
