/**
 * server/src/services/dataConfidence.js
 *
 * PHASE 0:
 * Evidence/provenance-aware confidence while preserving the
 * original freshness-based confidence API.
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

const SOURCE_TIERS = {
  official_government: 100,
  verified_local: 85,
  secondary_research: 65,
  assumption: 10,
};

/**
 * Parse a date safely.
 */
function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Original freshness-based confidence API.
 *
 * < 90 days   => high
 * < 180 days  => medium
 * >= 180 days => low
 */
function confidenceFromAge(lastUpdated) {
  const updatedDate = parseDate(lastUpdated);

  if (!updatedDate) {
    return "low";
  }

  const ageDays =
    (Date.now() - updatedDate.getTime()) / MS_PER_DAY;

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
 * Freshness score used by the evidence model.
 */
function freshnessScore(lastUpdated) {
  const updatedDate = parseDate(lastUpdated);

  if (!updatedDate) {
    return 15;
  }

  const ageDays =
    (Date.now() - updatedDate.getTime()) / MS_PER_DAY;

  if (ageDays < 0) {
    return 15;
  }

  if (ageDays <= 30) return 100;
  if (ageDays <= 90) return 90;
  if (ageDays <= 180) return 75;
  if (ageDays <= 365) return 55;
  if (ageDays <= 730) return 35;

  return 15;
}

/**
 * Geographic precision score.
 */
function geographicScore(match) {
  return (
    {
      exact: 100,
      village: 100,
      district: 75,
      state: 55,
      unknown: 25,
    }[match] ?? 25
  );
}

/**
 * Coverage score.
 */
function coverageScore(coverage) {
  return (
    {
      complete: 100,
      known: 75,
      local: 75,
      partial: 55,
      unknown: 25,
      no_matching_village_record: 25,
    }[coverage] ?? 25
  );
}

/**
 * Infer source tier where callers have only supplied a source name.
 */
function inferSourceTier(source) {
  if (!source) {
    return "assumption";
  }

  const normalized = String(source).toLowerCase();

  if (
    normalized.includes("census") ||
    normalized.includes("udyam") ||
    normalized.includes("government") ||
    normalized.includes("asuse")
  ) {
    return "official_government";
  }

  if (
    normalized.includes("verified") ||
    normalized.includes("field")
  ) {
    return "verified_local";
  }

  if (
    normalized.includes("research") ||
    normalized.includes("secondary") ||
    normalized.includes("osm")
  ) {
    return "secondary_research";
  }

  return "assumption";
}

/**
 * Evidence-based confidence.
 *
 * This remains available for callers that explicitly want
 * the evidence scoring model.
 */
function confidenceFromEvidence({
  sourceTier,
  lastUpdated,
  geographicMatch = "exact",
  coverage = "known",
  isAssumption = false,
}) {
  if (
    isAssumption ||
    sourceTier === "assumption"
  ) {
    return "low";
  }

  const authority =
    SOURCE_TIERS[sourceTier] ?? 40;

  const freshness =
    freshnessScore(lastUpdated);

  const geography =
    geographicScore(geographicMatch);

  const coverageValue =
    coverageScore(coverage);

  const score =
    authority * 0.4 +
    freshness * 0.25 +
    geography * 0.2 +
    coverageValue * 0.15;

  if (score >= 80) return "high";
  if (score >= 60) return "medium";

  return "low";
}

/**
 * Lower confidence by exactly one level.
 *
 * high -> medium
 * medium -> low
 * low -> low
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
 * Human-readable confidence explanation.
 */
function confidenceNote({
  confidence,
  sourceType,
  estimated = false,
  geographicMatch = "unknown",
  coverage = "unknown",
}) {
  if (estimated) {
    return "This value is an estimate because sufficiently specific evidence was unavailable.";
  }

  if (confidence === "low") {
    return "Evidence is limited, indirect, incomplete, or not sufficiently recent.";
  }

  if (
    geographicMatch !== "unknown" &&
    geographicMatch !== "exact"
  ) {
    return "Evidence is available but does not exactly match the requested village.";
  }

  if (coverage === "partial") {
    return "The source provides partial coverage and may not represent every household or business.";
  }

  if (sourceType === "secondary") {
    return "This value comes from a secondary source rather than an official local record.";
  }

  return "The available data is relatively recent and reliable for the stated coverage.";
}

/**
 * Wrap a metric with auditable provenance.
 *
 * IMPORTANT:
 * Preserve the original freshness-based confidence behavior
 * unless the caller explicitly provides a confidence value.
 *
 * Evidence metadata is retained for auditability, but it does
 * not silently change the original confidence API.
 */
function wrapMetric(value, metadata = {}) {
  const source =
    metadata.source ?? "unknown";

  const sourceTier =
    metadata.sourceTier ||
    inferSourceTier(source);

  const sourceType =
    metadata.sourceType ||
    (
      sourceTier === "official_government"
        ? "official"
        : sourceTier === "verified_local"
          ? "verified_local"
          : sourceTier === "secondary_research"
            ? "secondary"
            : "assumption"
    );

  const estimated =
    metadata.estimated ??
    metadata.isAssumption ??
    sourceTier === "assumption";

  let confidence;

  /*
   * Explicit confidence always wins.
   */
  if (metadata.confidence) {
    confidence = metadata.confidence;
  }

  /*
   * Verified data is always high confidence.
   */
  else if (metadata.verified) {
    confidence = "high";
  }

  /*
   * Preserve the original freshness-based API.
   *
   * < 90 days  -> high
   * < 180 days -> medium
   * >= 180     -> low
   */
  else {
    confidence = confidenceFromAge(
      metadata.lastUpdated
    );
  }

  const authority =
    metadata.authority ??
    SOURCE_TIERS[sourceTier] ??
    40;

  const geographicMatch =
    metadata.geographicMatch ||
    metadata.geographicPrecision ||
    "unknown";

  const coverage =
    metadata.coverage ||
    "unknown";

  return {
    value,

    min:
      metadata.min ?? null,

    max:
      metadata.max ?? null,

    confidence,

    source,

    sourceTier,

    sourceType,

    authority,

    dataYear:
      metadata.dataYear ?? null,

    lastUpdated:
      metadata.lastUpdated ?? null,

    geographicMatch,

    coverage,

    geographicPrecision:
      metadata.geographicPrecision ||
      "unknown",

    completeness:
      metadata.completeness ||
      "unknown",

    verified:
      Boolean(metadata.verified),

    isAssumption:
      Boolean(metadata.isAssumption),

    estimated:
      Boolean(estimated),

    note:
      metadata.note ??
      confidenceNote({
        confidence,
        sourceType,
        estimated: Boolean(estimated),
        geographicMatch,
        coverage,
      }),
  };
}

module.exports = {
  confidenceFromAge,
  confidenceFromEvidence,
  freshnessScore,
  wrapMetric,
  stepDownConfidence,
  confidenceNote,
  inferSourceTier,
  SOURCE_TIERS,
  HIGH_CONFIDENCE_MAX_DAYS,
  MEDIUM_CONFIDENCE_MAX_DAYS,
};