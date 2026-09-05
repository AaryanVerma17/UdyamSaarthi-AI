/**
 * server/src/services/dataConfidence.js
 *
 * Confidence decay + metric wrapping. Every metric that flows through here
 * stops being a bare number and becomes an auditable object: value, range,
 * source, freshness, and whether a human ever confirmed it on the ground.
 *
 * Confidence decay rule (as specified):
 *   age < 90 days   -> "high"
 *   age < 180 days  -> "medium"
 *   age >= 180 days -> "low"
 *   no lastUpdated  -> "low" (we cannot claim freshness we don't know)
 */

const HIGH_CONFIDENCE_MAX_DAYS = 90;
const MEDIUM_CONFIDENCE_MAX_DAYS = 180;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * @param {string|Date|null|undefined} lastUpdated - ISO date string or Date
 * @returns {"high"|"medium"|"low"}
 */
function confidenceFromAge(lastUpdated) {
  if (!lastUpdated) return "low";

  const updatedTime = new Date(lastUpdated).getTime();
  if (Number.isNaN(updatedTime)) return "low"; // unparseable date -> can't trust it

  const ageDays = (Date.now() - updatedTime) / MS_PER_DAY;

  if (ageDays < 0) return "low"; // a future date is a data-quality bug, not "fresh"
  if (ageDays < HIGH_CONFIDENCE_MAX_DAYS) return "high";
  if (ageDays < MEDIUM_CONFIDENCE_MAX_DAYS) return "medium";
  return "low";
}

/**
 * Wraps a raw metric value into the standard confidence-tagged shape.
 * This is the shape every Module 1/3/10 metric should take by the time it
 * reaches report assembly.
 *
 * @param {number|string} value
 * @param {object} meta
 * @param {number} [meta.min] - lower bound of a range, if applicable
 * @param {number} [meta.max] - upper bound of a range, if applicable
 * @param {string} [meta.source] - human-readable data source label
 * @param {string} [meta.lastUpdated] - ISO date the underlying data was last refreshed
 * @param {boolean} [meta.verified] - true if this value came from a field-verified correction
 * @returns {{value:*, min:?number, max:?number, source:string, lastUpdated:?string, confidence:"high"|"medium"|"low", verified:boolean}}
 */
function wrapMetric(value, meta = {}) {
  const { min = null, max = null, source = "unknown", lastUpdated = null, verified = false } = meta;

  return {
    value,
    min,
    max,
    source,
    lastUpdated,
    // A verified field correction is always high confidence by definition —
    // someone checked it on the ground. Otherwise confidence decays by age.
    confidence: verified ? "high" : confidenceFromAge(lastUpdated),
    verified: !!verified,
  };
}

module.exports = {
  confidenceFromAge,
  wrapMetric,
  HIGH_CONFIDENCE_MAX_DAYS,
  MEDIUM_CONFIDENCE_MAX_DAYS,
};
