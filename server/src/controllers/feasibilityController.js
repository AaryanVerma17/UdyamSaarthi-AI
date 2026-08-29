const financialEngine = require("../services/financialEngine");
const schemeRouter = require("../services/schemeRouter");
const repaymentPlanner = require("../services/repaymentPlanner");
const workingCapitalPlanner = require("../services/workingCapitalPlanner");
const mlClient = require("../clients/mlServiceClient");
const Report = require("../models/Report");
const { InvalidInputError, AppError } = require("../middlewares/errorHandler");

/**
 * Master orchestration endpoint — Section 6.2 of the technical documentation.
 * Sequences Modules 1-10 + the AI Advisor explanation layer, in the exact
 * order the architecture specifies. Deterministic engines (M5-M8) run
 * in-process; everything else calls ml_service.
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
      // Module 4
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

    // AI Advisor — explanation only, receives every computed fact as context
    let narrative;
    try {
      narrative = await mlClient.explain({
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
      pricing,
      swot: viability.swot || null,
      financials,
      scheme,
      repayment,
      workingCapital,
      risks: risks.risks || risks,
      finalRecommendation: narrative.finalRecommendation || deriveRecommendation(viability, repayment),
      narrative,
    };

    // Persist if MongoDB is connected; degrade gracefully otherwise
    try {
      const saved = await Report.create(report);
      report.reportId = saved._id;
    } catch (persistErr) {
      console.warn("[feasibility] Could not persist report:", persistErr.message);
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
