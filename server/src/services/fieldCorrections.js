/**
 * server/src/services/fieldCorrections.js
 *
 * Ground-truth override layer. Checks field_corrections.json (later:
 * a `ground_truth_corrections` Postgres table — see loadCorrections()
 * for the swap point) before falling back to whatever the online/scraped
 * metric already says.
 *
 * THE RULE, EXACTLY AS SPECIFIED:
 *   - A VERIFIED correction always wins outright. No averaging, no
 *     blending with the online number. The online value is discarded
 *     entirely in favor of the field-verified one.
 *   - An UNVERIFIED field report never overrides the online value. It
 *     is surfaced alongside it (so a human can see the discrepancy) and
 *     nudges confidence down a notch, but the online number stands.
 *   - Corrections EXPIRE. Past the TTL, a correction is treated as if
 *     it doesn't exist — the online value reverts to being the plain
 *     default, not "an expired override applied anyway."
 */

const fs = require("fs");
const path = require("path");

const {
  stepDownConfidence,
} = require("./dataConfidence");

const CORRECTIONS_PATH = path.join(
  __dirname,
  "..",
  "data",
  "field_corrections.json"
);

const DEFAULT_TTL_DAYS = 150;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Builds the lookup key used in field_corrections.json.
 * Kept as a single function so every caller constructs keys identically.
 */
function buildCorrectionKey({
  village,
  district,
  businessCategory,
  metric,
}) {
  return `village:${village}|district:${district}|business:${businessCategory}|metric:${metric}`;
}

let _cache = null;

/**
 * Loads corrections from field_corrections.json.
 *
 * SWAP POINT:
 * once corrections outgrow a flat file, replace this function's body
 * with a query against a ground_truth_corrections Postgres table.
 */
function loadCorrections() {
  if (_cache) {
    return _cache;
  }

  try {
    const raw = fs.readFileSync(
      CORRECTIONS_PATH,
      "utf-8"
    );

    const parsed = JSON.parse(raw);

    _cache = Array.isArray(parsed.corrections)
      ? parsed.corrections
      : [];
  } catch (err) {
    console.warn(
      "[fieldCorrections] Could not load field_corrections.json:",
      err.message
    );

    _cache = [];
  }

  return _cache;
}

function clearCache() {
  _cache = null;
}

function isExpired(
  verifiedAt,
  ttlDays = DEFAULT_TTL_DAYS
) {
  if (!verifiedAt) {
    return true;
  }

  const parsedDate = new Date(verifiedAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return true;
  }

  const ageDays =
    (Date.now() - parsedDate.getTime()) /
    MS_PER_DAY;

  return ageDays > ttlDays;
}

/**
 * @param {string} key
 * @param {number} [ttlDays]
 * @returns {object|null}
 */
function getCorrection(
  key,
  ttlDays = DEFAULT_TTL_DAYS
) {
  const corrections = loadCorrections();

  const match = corrections.find(
    (correction) => correction.key === key
  );

  if (!match) {
    return null;
  }

  if (
    isExpired(
      match.verifiedAt,
      ttlDays
    )
  ) {
    return null;
  }

  return match;
}

/**
 * Applies the correction rule to an already
 * confidence-wrapped online metric.
 *
 * VERIFIED:
 *   field value replaces online value.
 *
 * UNVERIFIED:
 *   online value remains unchanged.
 *   field report is surfaced.
 *   confidence steps down one level.
 */
function applyCorrection(
  onlineMetric,
  key,
  ttlDays = DEFAULT_TTL_DAYS
) {
  const correction = getCorrection(
    key,
    ttlDays
  );

  if (!correction) {
    return onlineMetric;
  }

  if (correction.verified) {
    return {
      ...onlineMetric,
      value: correction.value,
      source: correction.source,
      lastUpdated: correction.verifiedAt,
      confidence: "high",
      verified: true,
    };
  }

  return {
    ...onlineMetric,
    confidence: stepDownConfidence(
      onlineMetric.confidence
    ),
    fieldReport: {
      value: correction.value,
      source: correction.source,
      verifiedAt: correction.verifiedAt,
      note: correction.note || null,
    },
  };
}

module.exports = {
  buildCorrectionKey,
  getCorrection,
  applyCorrection,
  isExpired,
  clearCache,
  DEFAULT_TTL_DAYS,
};