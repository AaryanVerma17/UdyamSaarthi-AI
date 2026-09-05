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
const { confidenceFromAge } = require("./dataConfidence");

const CORRECTIONS_PATH = path.join(__dirname, "..", "data", "field_corrections.json");
const DEFAULT_TTL_DAYS = 150; // within the specified 90-180 day range
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1 };
const CONFIDENCE_BY_RANK = { 3: "high", 2: "medium", 1: "low" };

function stepDownConfidence(confidence) {
  const rank = CONFIDENCE_RANK[confidence] ?? 1;
  return CONFIDENCE_BY_RANK[Math.max(1, rank - 1)];
}

/**
 * Builds the lookup key used in field_corrections.json. Kept as a single
 * function so every caller constructs keys identically — never hand-build
 * this string inline elsewhere.
 */
function buildCorrectionKey({ village, district, businessCategory, metric }) {
  return `village:${village}|district:${district}|business:${businessCategory}|metric:${metric}`;
}

let _cache = null;

/**
 * Loads corrections from field_corrections.json. Cached in-process;
 * call clearCache() in tests or after an admin edits the file live.
 *
 * SWAP POINT: once corrections outgrow a flat file, replace this
 * function's body with a query against a `ground_truth_corrections`
 * Postgres table (see server/src/config/postgres.js) — every caller of
 * getCorrection()/applyCorrection() stays unchanged.
 */
function loadCorrections() {
  if (_cache) return _cache;
  try {
    const raw = fs.readFileSync(CORRECTIONS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    _cache = parsed.corrections || [];
  } catch (err) {
    console.warn("[fieldCorrections] Could not load field_corrections.json:", err.message);
    _cache = [];
  }
  return _cache;
}

function clearCache() {
  _cache = null;
}

function isExpired(verifiedAt, ttlDays = DEFAULT_TTL_DAYS) {
  if (!verifiedAt) return true;
  const ageDays = (Date.now() - new Date(verifiedAt).getTime()) / MS_PER_DAY;
  return Number.isNaN(ageDays) || ageDays > ttlDays;
}

/**
 * @param {string} key - from buildCorrectionKey()
 * @param {number} [ttlDays]
 * @returns {object|null} the raw correction record, or null if none exists or it has expired
 */
function getCorrection(key, ttlDays = DEFAULT_TTL_DAYS) {
  const corrections = loadCorrections();
  const match = corrections.find((c) => c.key === key);
  if (!match) return null;
  if (isExpired(match.verifiedAt, ttlDays)) return null; // expired -> treated as absent
  return match;
}

/**
 * Applies the correction rule to an already-confidence-wrapped online
 * metric (the output of dataConfidence.wrapMetric()).
 *
 * @param {object} onlineMetric - shape from dataConfidence.wrapMetric()
 * @param {string} key - from buildCorrectionKey()
 * @param {number} [ttlDays]
 * @returns {object} the (possibly overridden) metric, plus a `fieldReport`
 *   field when an unverified correction exists alongside an unchanged value
 */
function applyCorrection(onlineMetric, key, ttlDays = DEFAULT_TTL_DAYS) {
  const correction = getCorrection(key, ttlDays);
  if (!correction) return onlineMetric; // no correction, or it expired -> plain online default stands

  if (correction.verified) {
    // Verified field data wins outright. No blending with the online value.
    return {
      ...onlineMetric,
      value: correction.value,
      source: correction.source,
      lastUpdated: correction.verifiedAt,
      confidence: "high",
      verified: true,
    };
  }

  // Unverified: never override the value. Surface it, and nudge confidence
  // down one notch since a conflicting report exists.
  return {
    ...onlineMetric,
    confidence: stepDownConfidence(onlineMetric.confidence),
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
