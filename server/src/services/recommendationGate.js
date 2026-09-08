/**
 * server/src/services/recommendationGate.js
 *
 * PHASE 0:
 *
 * Competition is a warning signal, not automatic rejection.
 *
 * A saturated market should trigger:
 *
 * Existing business
 *      ↓
 * Competition warning
 *      ↓
 * Differentiation
 *      ↓
 * Re-evaluation
 *
 * The actual differentiation/re-evaluation engine will be implemented
 * in a later phase.
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

const SATURATION_CEILING =
  "proceed_with_caution";

const MAX_SURFACED_ALTERNATIVES = 3;


function applyRecommendationGate({
  rawRecommendation,
  competitorClassification,
  opportunities,
}) {
  const rawRank =
    RECOMMENDATION_RANK[
      rawRecommendation
    ];

  if (rawRank === undefined) {
    throw new Error(
      `recommendationGate: unrecognized rawRecommendation "${rawRecommendation}"`
    );
  }

  const isSaturated =
    competitorClassification ===
    "highly_saturated";

  if (!isSaturated) {
    return {
      finalRecommendation:
        rawRecommendation,
      gated: false,
      saturationWarning: false,
      surfacedAlternatives:
        null,
    };
  }

  const ceilingRank =
    RECOMMENDATION_RANK[
      SATURATION_CEILING
    ];

  const cappedRank =
    Math.min(
      rawRank,
      ceilingRank
    );

  const finalRecommendation =
    RECOMMENDATION_BY_RANK[
      cappedRank
    ];

  const surfacedAlternatives =
    (
      opportunities?.alternatives ||
      []
    ).slice(
      0,
      MAX_SURFACED_ALTERNATIVES
    );

  return {
    finalRecommendation,
    gated:
      cappedRank < rawRank,
    saturationWarning: true,
    surfacedAlternatives,
  };
}


module.exports = {
  applyRecommendationGate,
  SATURATION_CEILING,
  RECOMMENDATION_RANK,
};