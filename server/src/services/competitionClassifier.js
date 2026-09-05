/**
 * server/src/services/competitionClassifier.js
 *
 * MUST mirror ml_service/app/api/v1/competitor_mapping.py's classify()
 * thresholds EXACTLY. This exists so that when a field correction changes
 * a competitor count in feasibilityController.js (after ml_service has
 * already run), Node can re-derive the classification without a second
 * round-trip to ml_service — and without the two sides silently drifting
 * apart over time. If you change the thresholds in one place, change them
 * in both, in the same commit.
 */
function classifyCompetitionCount(count) {
  if (count <= 3) return "under_served";
  if (count <= 7) return "moderately_competitive";
  return "highly_saturated";
}

module.exports = { classifyCompetitionCount };
