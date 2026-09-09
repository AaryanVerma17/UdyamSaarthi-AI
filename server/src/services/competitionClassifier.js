/**
 * Shared competition classification.
 *
 * PHASE 5
 *
 * The classifier works ONLY with an identifiable,
 * category-specific competitor count.
 *
 * It does not estimate:
 * - informal businesses
 * - unlisted businesses
 * - newly opened businesses
 * - businesses missing from available datasets
 *
 * null / undefined means:
 *
 *     data_unavailable
 *
 * It does NOT mean:
 *
 *     under_served
 */

function classifyCompetitionCount(count) {
  /*
   * Missing evidence.
   */
  if (
    count === null ||
    count === undefined
  ) {
    return "data_unavailable";
  }

  /*
   * Reject booleans and non-numbers.
   *
   * Number(true) would otherwise become 1.
   */
  if (
    typeof count !== "number" ||
    !Number.isFinite(count)
  ) {
    return "data_unavailable";
  }

  /*
   * Negative competitor counts are invalid.
   */
  if (count < 0) {
    return "data_unavailable";
  }

  /*
   * 0–3 identifiable competitors.
   */
  if (count <= 3) {
    return "under_served";
  }

  /*
   * 4–7 identifiable competitors.
   */
  if (count <= 7) {
    return "moderately_competitive";
  }

  /*
   * 8+ identifiable competitors.
   */
  return "highly_saturated";
}


module.exports = {
  classifyCompetitionCount,
};