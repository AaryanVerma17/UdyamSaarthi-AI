/**
 * Shared competition classification.
 *
 * PHASE 0:
 *
 * The thresholds classify ONLY an identifiable
 * category-specific count.
 *
 * They do not estimate the number of
 * informal/unlisted businesses.
 */

function classifyCompetitionCount(count) {
  if (
    typeof count !== "number" ||
    !Number.isFinite(count) ||
    count < 0
  ) {
    throw new Error(
      "competition count must be a non-negative number"
    );
  }

  if (count <= 3) {
    return "under_served";
  }

  if (count <= 7) {
    return "moderately_competitive";
  }

  return "highly_saturated";
}

module.exports = {
  classifyCompetitionCount,
};