/**
 * server/src/services/recommendationGate.js
 *
 * Sits between Module 3/4 (competitor mapping / opportunity finder) and
 * report assembly in feasibilityController.js.
 *
 * THE RULE: a "highly_saturated" competitor classification acts as a
 * CEILING on the recommendation, never a floor. A high viability score
 * alone can never produce "proceed" in a saturated market — at most it
 * can produce "proceed_with_caution". The gate only ever downgrades the
 * raw recommendation; it never upgrades one that was already more
 * cautious than that (e.g. it won't turn "not_recommended" into
 * "proceed_with_caution").
 *
 * When the gate triggers, it also promotes surfaced alternatives so the
 * report can show them right under the viability score instead of
 * leaving the user to scroll to the Opportunity Finder section to
 * discover a better option exists.
 */

const RECOMMENDATION_RANK = {
  proceed: 3,
  proceed_with_caution: 2,
  not_recommended: 1,
};

const RECOMMENDATION_BY_RANK = {
  3: "proceed",
  2: "proceed_with_caution",
  1: "not_recommended",
};

const SATURATION_CEILING = "proceed_with_caution";
const MAX_SURFACED_ALTERNATIVES = 3;

/**
 * @param {object} params
 * @param {"proceed"|"proceed_with_caution"|"not_recommended"} params.rawRecommendation
 *   the recommendation as computed before this gate (e.g. from viability + repayment capacity)
 * @param {"under_served"|"moderately_competitive"|"highly_saturated"} params.competitorClassification
 *   Module 3's classification for the REQUESTED business specifically
 * @param {{alternatives?: Array<{business:string, score:number}>}} [params.opportunities]
 *   Module 4's output — already expected to have saturated alternatives filtered out
 *   (see the Module 4 change in opportunity.py) before it reaches this gate
 * @returns {{finalRecommendation: string, gated: boolean, surfacedAlternatives: Array|null}}
 */
function applyRecommendationGate({ rawRecommendation, competitorClassification, opportunities }) {
  const rawRank = RECOMMENDATION_RANK[rawRecommendation];
  if (rawRank === undefined) {
    throw new Error(`recommendationGate: unrecognized rawRecommendation "${rawRecommendation}"`);
  }

  const isSaturated = competitorClassification === "highly_saturated";

  if (!isSaturated) {
    return { finalRecommendation: rawRecommendation, gated: false, surfacedAlternatives: null };
  }

  const ceilingRank = RECOMMENDATION_RANK[SATURATION_CEILING];
  const cappedRank = Math.min(rawRank, ceilingRank);
  const finalRecommendation = RECOMMENDATION_BY_RANK[cappedRank];

  const surfacedAlternatives = (opportunities?.alternatives || []).slice(0, MAX_SURFACED_ALTERNATIVES);

  return {
    finalRecommendation,
    gated: cappedRank < rawRank, // true only if the cap actually changed something
    surfacedAlternatives,
  };
}

module.exports = { applyRecommendationGate, SATURATION_CEILING, RECOMMENDATION_RANK };
