/**
 * UdyamSaarthi-AI
 *
 * Phase 0 — Data Confidence & Provenance
 *
 * Confidence describes how trustworthy the available evidence is.
 * It does NOT mean that the underlying number is guaranteed to be true.
 */

const HIGH_CONFIDENCE_MAX_DAYS = 90;
const MEDIUM_CONFIDENCE_MAX_DAYS = 180;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const CONFIDENCE_RANK = {
  low: 1,
  medium: 2,
  high: 3,
};

const CONFIDENCE_BY_RANK = {
  1: "low",
  2: "medium",
  3: "high",
};

/**
 * Convert data age into freshness confidence.
 */
function confidenceFromAge(lastUpdated) {
  if (!lastUpdated) return "low";

  const updatedTime = new Date(lastUpdated).getTime();

  if (Number.isNaN(updatedTime)) {
    return "low";
  }

  const ageDays =
    (Date.now() - updatedTime) / MS_PER_DAY;

  if (ageDays < 0) {
    return "low";
  }

  if (ageDays < HIGH_CONFIDENCE_MAX_DAYS) {
    return "high";
  }

  if (ageDays < MEDIUM_CONFIDENCE_MAX_DAYS) {
    return "medium";
  }

  return "low";
}

/**
 * Reduce confidence by one level.
 */
function stepDownConfidence(confidence) {
  const rank =
    CONFIDENCE_RANK[confidence] ??
    CONFIDENCE_RANK.low;

  return (
    CONFIDENCE_BY_RANK[
      Math.max(1, rank - 1)
    ] || "low"
  );
}

/**
 * Create an auditable metric object.
 */
function wrapMetric(value, meta = {}) {
  const {
    min = null,
    max = null,
    source = "unknown",
    sourceType = "unknown",
    authority = "unknown",
    coverage = "unknown",
    geographicPrecision = "unknown",
    completeness = "unknown",
    lastUpdated = null,
    verified = false,
    estimated = false,
    note = null,
  } = meta;

  return {
    value,
    min,
    max,
    source,
    sourceType,
    authority,
    coverage,
    geographicPrecision,
    completeness,
    lastUpdated,
    confidence: verified
      ? "high"
      : confidenceFromAge(lastUpdated),
    verified: !!verified,
    estimated: !!estimated,
    note,
  };
}

/**
 * Human-readable explanation of confidence.
 */
function confidenceNote(metric) {
  if (!metric) {
    return "No confidence information is available.";
  }

  if (metric.verified) {
    return "This value has been field-verified.";
  }

  if (metric.estimated) {
    return "This value is an estimate and should not be treated as an exact count.";
  }

  if (metric.confidence === "low") {
    return "Limited or stale data is available for this metric.";
  }

  if (metric.confidence === "medium") {
    return "The available data is reasonably useful but should be validated locally.";
  }

  return "The available data is relatively recent and reliable for the stated coverage.";
}

module.exports = {
  confidenceFromAge,
  wrapMetric,
  confidenceNote,
  stepDownConfidence,
  HIGH_CONFIDENCE_MAX_DAYS,
  MEDIUM_CONFIDENCE_MAX_DAYS,
};