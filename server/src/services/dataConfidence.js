/**
 * UdyamSaarthi-AI — Evidence Confidence Utilities
 *
 * Confidence is determined using:
 * - source authority
 * - freshness
 * - geographic precision
 * - coverage
 *
 * Confidence is separate from business viability.
 */

const SOURCE_TIERS = {
  official_government: 100,
  verified_local: 85,
  secondary_research: 65,
  assumption: 10,
};

const CONFIDENCE_RANK = {
  high: 3,
  medium: 2,
  low: 1,
};

const CONFIDENCE_BY_RANK = {
  3: "high",
  2: "medium",
  1: "low",
};


// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}


// ---------------------------------------------------------------------------
// Freshness
// ---------------------------------------------------------------------------

function freshnessScore(lastUpdated) {
  const date = parseDate(lastUpdated);

  if (!date) return 0;

  const ageDays =
    Math.max(
      0,
      Date.now() - date.getTime()
    ) /
    (1000 * 60 * 60 * 24);

  if (ageDays <= 30) return 100;
  if (ageDays <= 90) return 90;
  if (ageDays <= 180) return 75;
  if (ageDays <= 365) return 55;
  if (ageDays <= 730) return 35;

  return 15;
}


// ---------------------------------------------------------------------------
// Geographic quality
// ---------------------------------------------------------------------------

function geographicScore(match) {
  return {
    exact: 100,
    district: 75,
    state: 55,
    unknown: 25,
  }[match] ?? 25;
}


// ---------------------------------------------------------------------------
// Coverage quality
// ---------------------------------------------------------------------------

function coverageScore(coverage) {
  return {
    complete: 100,
    known: 75,
    partial: 55,
    unknown: 25,
  }[coverage] ?? 25;
}


// ---------------------------------------------------------------------------
// Source inference
// ---------------------------------------------------------------------------

function inferSourceTier(source) {
  if (!source) {
    return "assumption";
  }

  const normalized =
    String(source).toLowerCase();

  if (
    normalized.includes("census") ||
    normalized.includes("udyam") ||
    normalized.includes("government") ||
    normalized.includes("asuse") ||
    normalized.includes("official")
  ) {
    return "official_government";
  }

  if (
    normalized.includes("verified") ||
    normalized.includes("field") ||
    normalized.includes("local")
  ) {
    return "verified_local";
  }

  if (
    normalized.includes("research") ||
    normalized.includes("secondary")
  ) {
    return "secondary_research";
  }

  return "assumption";
}


// ---------------------------------------------------------------------------
// Overall evidence confidence
// ---------------------------------------------------------------------------

function confidenceFromEvidence({
  sourceTier,
  lastUpdated,
  geographicMatch = "unknown",
  coverage = "unknown",
  isAssumption = false,
}) {
  if (
    isAssumption ||
    sourceTier === "assumption"
  ) {
    return "low";
  }

  const authority =
    SOURCE_TIERS[sourceTier] ??
    40;

  const freshness =
    freshnessScore(lastUpdated);

  const geography =
    geographicScore(
      geographicMatch
    );

  const coverageValue =
    coverageScore(
      coverage
    );

  const score =
    authority * 0.4 +
    freshness * 0.25 +
    geography * 0.2 +
    coverageValue * 0.15;

  if (score >= 80) {
    return "high";
  }

  if (score >= 60) {
    return "medium";
  }

  return "low";
}


// ---------------------------------------------------------------------------
// Confidence downgrade
// ---------------------------------------------------------------------------

function stepDownConfidence(confidence) {
  const rank =
    CONFIDENCE_RANK[confidence] ??
    1;

  return (
    CONFIDENCE_BY_RANK[
      Math.max(
        1,
        rank - 1
      )
    ] ||
    "low"
  );
}


// ---------------------------------------------------------------------------
// Human-readable confidence explanation
// ---------------------------------------------------------------------------

function confidenceNote({
  confidence,
  sourceType,
  estimated = false,
  geographicMatch = "unknown",
  coverage = "unknown",
}) {
  if (estimated) {
    return (
      "This value is an estimate because sufficiently "
      + "specific evidence was unavailable."
    );
  }

  if (confidence === "low") {
    return (
      "Evidence is limited, indirect, incomplete, "
      + "or not sufficiently recent."
    );
  }

  if (geographicMatch !== "exact") {
    return (
      "Evidence is available but does not exactly "
      + "match the requested village."
    );
  }

  if (coverage === "partial") {
    return (
      "The source provides partial coverage and may "
      + "not represent every household or business."
    );
  }

  if (sourceType === "secondary") {
    return (
      "This value comes from a secondary source rather "
      + "than an official local record."
    );
  }

  return null;
}


// ---------------------------------------------------------------------------
// Metric wrapper
// ---------------------------------------------------------------------------

function wrapMetric(value, metadata = {}) {
  const source =
    metadata.source ||
    "Unknown source";

  const sourceTier =
    metadata.sourceTier ||
    inferSourceTier(source);

  const isAssumption =
    metadata.isAssumption ??
    (
      sourceTier === "assumption"
    );

  const estimated =
    metadata.estimated ??
    isAssumption;

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

  const confidence =
    metadata.confidence ||
    confidenceFromEvidence({
      sourceTier,

      lastUpdated:
        metadata.lastUpdated,

      geographicMatch:
        metadata.geographicMatch ||
        "unknown",

      coverage:
        metadata.coverage ||
        "unknown",

      isAssumption,
    });

  const authority =
    metadata.authority ??
    SOURCE_TIERS[sourceTier] ??
    40;

  const result = {
    value,

    min:
      metadata.min ??
      null,

    max:
      metadata.max ??
      null,

    confidence,

    source,

    sourceTier,

    sourceType,

    authority,

    dataYear:
      metadata.dataYear ??
      null,

    lastUpdated:
      metadata.lastUpdated ??
      null,

    geographicMatch:
      metadata.geographicMatch ||
      "unknown",

    coverage:
      metadata.coverage ||
      "unknown",

    verified:
      Boolean(
        metadata.verified
      ),

    isAssumption:

      Boolean(
        isAssumption
      ),

    estimated:
      Boolean(
        estimated
      ),

    note:
      metadata.note ??
      confidenceNote({
        confidence,
        sourceType,
        estimated,
        geographicMatch:
          metadata.geographicMatch ||
          "unknown",
        coverage:
          metadata.coverage ||
          "unknown",
      }),
  };

  return result;
}


module.exports = {
  confidenceFromEvidence,
  freshnessScore,
  wrapMetric,
  stepDownConfidence,
  confidenceNote,
  inferSourceTier,
  SOURCE_TIERS,
};