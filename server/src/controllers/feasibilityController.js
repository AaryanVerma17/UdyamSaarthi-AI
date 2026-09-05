const financialEngine = require("../services/financialEngine");
const schemeRouter = require("../services/schemeRouter");
const repaymentPlanner = require("../services/repaymentPlanner");
const workingCapitalPlanner = require("../services/workingCapitalPlanner");
const { wrapMetric } = require("../services/dataConfidence");
const { buildCorrectionKey, applyCorrection } = require("../services/fieldCorrections");
const { classifyCompetitionCount } = require("../services/competitionClassifier");
const { applyRecommendationGate } = require("../services/recommendationGate");
const mlClient = require("../clients/mlServiceClient");
const Report = require("../models/Report");
const { createLoanApplication, insertEmiLedger } = require("../models/postgres/loanApplicationModel");
const { InvalidInputError, AppError } = require("../middlewares/errorHandler");

/**
 * Master orchestration endpoint — Section 6.2 of the technical documentation.
 * Sequences Modules 1-10 + the AI Advisor explanation layer, in the exact
 * order the architecture specifies. Deterministic engines (M5-M8) run
 * in-process; everything else calls ml_service.
 *
 * Also applies, in order:
 *   1. Data confidence tagging + field-verified overrides (Modules 1, 3, 10)
 *   2. The recommendation gate (saturation caps "proceed")
 *
 * KNOWN LIMITATION (flagged deliberately, not hidden): field corrections
 * are applied HERE, after ml_service has already run. This means a
 * verified correction updates the REPORTED competitor count, its
 * re-derived classification, and everything computed downstream of that
 * point in this function (the recommendation gate, the AI Advisor
 * narrative). It does NOT retroactively change ml_service's own internal
 * viability score or risk-section text, which were computed from the
 * pre-correction online count. In practice this means the Risk Analysis
 * section's wording could still cite the old count even when the
 * Competitor Mapping section shows a corrected one. Closing this
 * requires either (a) passing verified corrections INTO ml_service as a
 * request parameter before Modules 2/3/4/9 run, or (b) moving corrections
 * into a store ml_service can also read directly. Either is a reasonable
 * next step — this comment exists so nobody mistakes today's behavior for
 * a fully-closed loop.
 */
async function generate(req, res, next) {
  try {
    const { location, ownCapital, businessCategory, language = "en" } = req.body;

    if (!location || !location.village || !location.district) {
      throw new InvalidInputError("location.village and location.district are required");
    }
    if (!businessCategory) {
      throw new InvalidInputError("businessCategory is required");
    }

    let geoContext, viability, competitorMapping, opportunities, risks, pricing;

    try {
      // Module 1
      geoContext = await mlClient.getLocationIntelligence(location);
      // Module 2
      viability = await mlClient.scoreViability(geoContext, businessCategory);
      // Module 3
      competitorMapping = await mlClient.mapCompetitors(geoContext, businessCategory);
      // Module 4 (already excludes highly_saturated alternatives — see opportunity.py)
      opportunities = await mlClient.rankOpportunities(geoContext, ownCapital, businessCategory);
      // Module 9
      risks = await mlClient.analyzeRisks(geoContext, businessCategory);
      // Module 10
      pricing = await mlClient.recommendPricing(geoContext, businessCategory);
    } catch (mlErr) {
      const err = new AppError(
        "ml_service is unreachable or returned an invalid response",
        502
      );
      throw err;
    }

    // --- Data confidence tagging + field-verified overrides (Modules 1, 3, 10) ---

    const correctionScope = { village: location.village, district: location.district, businessCategory };

    let consumerBaseMetric = wrapMetric(geoContext.consumerBase, {
      source: geoContext.dataSource,
      lastUpdated: geoContext.lastUpdated,
    });
    consumerBaseMetric = applyCorrection(
      consumerBaseMetric,
      buildCorrectionKey({ ...correctionScope, metric: "consumerBase" })
    );
    geoContext.consumerBase = consumerBaseMetric.value; // verified correction, if any, becomes the reported value
    geoContext.consumerBaseConfidence = consumerBaseMetric;

    let competitorCountMetric = wrapMetric(competitorMapping.count, {
      source: competitorMapping.lastUpdated ? "ingested village business listing" : "estimated (no exact record for this village)",
      lastUpdated: competitorMapping.lastUpdated,
    });
    competitorCountMetric = applyCorrection(
      competitorCountMetric,
      buildCorrectionKey({ ...correctionScope, metric: "competitorCount" })
    );
    competitorMapping.count = competitorCountMetric.value;
    competitorMapping.countConfidence = competitorCountMetric;
    // Re-derive classification from the (possibly corrected) count so the
    // classification shown to the user, fed to the AI Advisor, and fed to
    // the recommendation gate all agree with the count actually displayed.
    competitorMapping.classification = classifyCompetitionCount(competitorMapping.count);

    // opportunities.requestedBusiness describes the SAME business+village
    // as competitorMapping above — if the correction changed the
    // classification there, it must change here too, or the report would
    // show two different saturation verdicts for one business in one place.
    // (opportunities.alternatives are OTHER business categories and are
    // deliberately left untouched — this correction is category-specific.)
    if (opportunities?.requestedBusiness) {
      opportunities.requestedBusiness.classification = competitorMapping.classification;
    }

    const priceMidpoint = Math.round(((pricing.range[0] + pricing.range[1]) / 2) * 100) / 100;
    let priceMetric = wrapMetric(priceMidpoint, {
      min: pricing.range[0],
      max: pricing.range[1],
      source: Array.isArray(pricing.basedOn) ? pricing.basedOn.join("; ") : pricing.basedOn,
      lastUpdated: pricing.lastUpdated,
    });
    priceMetric = applyCorrection(
      priceMetric,
      buildCorrectionKey({ ...correctionScope, metric: "priceRange" })
    );
    if (priceMetric.verified) {
      // A verified correction supplies a single confirmed price point; treat
      // it as a tight range rather than discarding min/max entirely.
      pricing.range = [priceMetric.value, priceMetric.value];
    }
    pricing.rangeConfidence = priceMetric;

    // Module 5 (deterministic, in-process)
    const financials = financialEngine.calculate(ownCapital);
    // Module 6 (deterministic, in-process)
    const scheme = schemeRouter.route(financials.projectCost);
    // Module 7 (deterministic, in-process)
    const repayment = repaymentPlanner.build(
      financials.loanAmount,
      scheme,
      viability.expectedCashFlow
    );
    // Module 8 (deterministic, in-process)
    const workingCapital = workingCapitalPlanner.allocate(
      financials.projectCost,
      businessCategory
    );

    // --- Recommendation gate (saturation caps "proceed", never upgrades) ---
    const rawRecommendation = deriveRecommendation(viability, repayment);
    const { finalRecommendation, gated, surfacedAlternatives } = applyRecommendationGate({
      rawRecommendation,
      competitorClassification: competitorMapping.classification,
      opportunities,
    });

    // AI Advisor — explanation only, receives every computed fact as
    // context, INCLUDING the corrected competitorMapping and the gated
    // recommendation, so its narrative never contradicts what the report
    // actually shows.
    let narrative;
    try {
      narrative = await mlClient.explain({
        businessCategory,
        viability,
        competitorMapping,
        opportunities,
        financials,
        scheme,
        repayment,
        workingCapital,
        risks,
        pricing,
        language,
      });
    } catch (explainErr) {
      narrative = {
        language,
        text:
          language === "hi"
            ? "व्याख्या सेवा अभी उपलब्ध नहीं है, लेकिन ऊपर दिए गए सभी आंकड़े सटीक हैं।"
            : "The explanation service is temporarily unavailable, but all figures above are accurate.",
      };
    }

    const report = {
      input: { location, ownCapital, businessCategory, language },
      viability,
      localMarket: geoContext,
      competitorMapping,
      opportunities,
      surfacedAlternatives, // promoted near the top by the client when non-null (saturation triggered)
      pricing,
      swot: viability.swot || null,
      financials,
      scheme,
      repayment,
      workingCapital,
      risks: risks.risks || risks,
      finalRecommendation,
      recommendationGated: gated,
      narrative,
    };

    // Persist the full report document if MongoDB is connected; degrade gracefully otherwise
    try {
      const saved = await Report.create(report);
      report.reportId = saved._id;
    } catch (persistErr) {
      console.warn("[feasibility] Could not persist report to MongoDB:", persistErr.message);
    }

    // Best-effort relational persistence (loan application + EMI ledger) if
    // Postgres is configured — never blocks or fails the response, since
    // MongoDB is the authoritative store for the full report.
    try {
      const loanApplicationId = await createLoanApplication({
        reportId: report.reportId || "unpersisted",
        userId: req.user?.id,
        ownCapital: financials.ownCapital,
        projectCost: financials.projectCost,
        loanAmount: financials.loanAmount,
        scheme,
      });
      if (loanApplicationId) {
        await insertEmiLedger(loanApplicationId, repayment.repaymentSchedule);
      }
    } catch (pgErr) {
      console.warn("[feasibility] Could not persist to PostgreSQL:", pgErr.message);
    }

    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
}

function deriveRecommendation(viability, repayment) {
  const score = viability?.score ?? 0;
  const capacity = repayment?.repaymentCapacity ?? "Unknown";
  if (score >= 75 && (capacity === "High" || capacity === "Medium")) return "proceed";
  if (score >= 50) return "proceed_with_caution";
  return "not_recommended";
}

module.exports = { generate };
