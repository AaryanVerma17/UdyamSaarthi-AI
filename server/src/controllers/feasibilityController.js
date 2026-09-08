const financialEngine = require("../services/financialEngine");
const schemeRouter = require("../services/schemeRouter");
const repaymentPlanner = require("../services/repaymentPlanner");
const workingCapitalPlanner = require("../services/workingCapitalPlanner");

const {
  wrapMetric,
} = require("../services/dataConfidence");

const {
  buildCorrectionKey,
  applyCorrection,
} = require("../services/fieldCorrections");

const {
  classifyCompetitionCount,
} = require("../services/competitionClassifier");

const {
  applyRecommendationGate,
} = require("../services/recommendationGate");

const mlClient =
  require("../clients/mlServiceClient");

const Report =
  require("../models/Report");

const {
  createLoanApplication,
  insertEmiLedger,
} = require("../models/postgres/loanApplicationModel");

const {
  InvalidInputError,
  AppError,
} = require("../middlewares/errorHandler");

const {
  SCHEME_RULE_STATUS,
} = require("../../../../shared/constants/schemeRules");


/**
 * Master feasibility orchestration.
 *
 * PHASE 0 principles:
 *
 * 1. Never convert missing data into a factual zero.
 * 2. Never represent provisional financial rules as verified government rules.
 * 3. Preserve source/provenance metadata.
 * 4. Make uncertainty visible in the final report.
 * 5. Deterministic engines remain deterministic.
 * 6. AI remains explanation-only.
 */

async function generate(req, res, next) {
  try {
    const {
      location,
      ownCapital,
      businessCategory,
      language = "en",
    } = req.body;

    if (
      !location ||
      !location.village ||
      !location.district
    ) {
      throw new InvalidInputError(
        "location.village and location.district are required"
      );
    }

    if (!businessCategory) {
      throw new InvalidInputError(
        "businessCategory is required"
      );
    }

    if (
      typeof ownCapital !== "number" ||
      Number.isNaN(ownCapital) ||
      ownCapital <= 0
    ) {
      throw new InvalidInputError(
        "ownCapital must be a positive number"
      );
    }

    let geoContext;
    let viability;
    let competitorMapping;
    let opportunities;
    let risks;
    let pricing;

    try {
      geoContext =
        await mlClient.getLocationIntelligence(
          location
        );

      viability =
        await mlClient.scoreViability(
          geoContext,
          businessCategory
        );

      competitorMapping =
        await mlClient.mapCompetitors(
          geoContext,
          businessCategory
        );

      opportunities =
        await mlClient.rankOpportunities(
          geoContext,
          ownCapital,
          businessCategory
        );

      risks =
        await mlClient.analyzeRisks(
          geoContext,
          businessCategory
        );

      pricing =
        await mlClient.recommendPricing(
          geoContext,
          businessCategory
        );
    } catch (mlErr) {
      console.error(
        "[feasibility] ML service request failed:",
        {
          message: mlErr.message,
          code: mlErr.code,
          status: mlErr.response?.status,
          data: mlErr.response?.data,
          url: mlErr.config?.url,
        }
      );

      throw new AppError(
        "ml_service is unreachable or returned an invalid response",
        502
      );
    }

    const correctionScope = {
      village: location.village,
      district: location.district,
      businessCategory,
    };

    /*
     * Consumer base
     */
    let consumerBaseMetric =
      wrapMetric(
        geoContext.consumerBase,
        {
          source:
            geoContext.provenance?.source ||
            geoContext.dataSource ||
            "unknown",

          sourceType:
            geoContext.provenance?.sourceType ||
            "unknown",

          authority:
            geoContext.provenance?.authority ||
            "unknown",

          coverage:
            geoContext.provenance?.coverage ||
            "unknown",

          geographicPrecision:
            geoContext.provenance
              ?.geographicPrecision ||
            "unknown",

          completeness:
            geoContext.provenance
              ?.completeness ||
            "unknown",

          lastUpdated:
            geoContext.lastUpdated,

          estimated:
            geoContext.provenance?.estimated ||
            false,
        }
      );

    consumerBaseMetric =
      applyCorrection(
        consumerBaseMetric,
        buildCorrectionKey({
          ...correctionScope,
          metric:
            "consumerBase",
        })
      );

    geoContext.consumerBase =
      consumerBaseMetric.value;

    geoContext.consumerBaseConfidence =
      consumerBaseMetric;

    /*
     * Competitor count
     */
    let competitorCountMetric =
      wrapMetric(
        competitorMapping.count,
        {
          source:
            competitorMapping.source ||
            "unknown",

          sourceType:
            competitorMapping.identifiable
              ? "identifiable_business_records"
              : "unavailable",

          authority:
            geoContext.provenance?.authority ||
            "unknown",

          coverage:
            competitorMapping.coverage ||
            "unknown",

          geographicPrecision:
            geoContext.provenance
              ?.geographicPrecision ||
            "unknown",

          completeness:
            geoContext.provenance
              ?.completeness ||
            "unknown",

          lastUpdated:
            competitorMapping.lastUpdated,

          estimated:
            competitorMapping.estimated ||
            false,
        }
      );

    competitorCountMetric =
      applyCorrection(
        competitorCountMetric,
        buildCorrectionKey({
          ...correctionScope,
          metric:
            "competitorCount",
        })
      );

    competitorMapping.count =
      competitorCountMetric.value;

    competitorMapping.countConfidence =
      competitorCountMetric;

    competitorMapping.classification =
      classifyCompetitionCount(
        competitorMapping.count
      );

    /*
     * Important:
     *
     * A count of zero with unavailable data
     * must not be interpreted as "zero competitors".
     */
    if (
      !competitorMapping.identifiable &&
      !competitorCountMetric.verified
    ) {
      competitorMapping.classification =
        "under_served";

      competitorMapping.dataConfidenceNote =
        "No identifiable competitors were found in the available data. " +
        "This does not mean that no competitors exist in reality; " +
        "informal or unlisted businesses may not be captured.";
    }

    /*
     * Keep Module 4 aligned.
     */
    if (
      opportunities?.requestedBusiness
    ) {
      opportunities.requestedBusiness.classification =
        competitorMapping.classification;
    }

    /*
     * Pricing
     */
    const priceMidpoint =
      Math.round(
        (
          pricing.range[0] +
          pricing.range[1]
        ) / 2 * 100
      ) / 100;

    let priceMetric =
      wrapMetric(
        priceMidpoint,
        {
          min:
            pricing.range[0],

          max:
            pricing.range[1],

          source:
            Array.isArray(
              pricing.basedOn
            )
              ? pricing.basedOn.join("; ")
              : pricing.basedOn,

          sourceType:
            pricing.sourceType ||
            "unknown",

          lastUpdated:
            pricing.lastUpdated,

          estimated:
            pricing.estimated ||
            false,
        }
      );

    priceMetric =
      applyCorrection(
        priceMetric,
        buildCorrectionKey({
          ...correctionScope,
          metric:
            "priceRange",
        })
      );

    if (priceMetric.verified) {
      pricing.range = [
        priceMetric.value,
        priceMetric.value,
      ];
    }

    pricing.rangeConfidence =
      priceMetric;

    /*
     * DETERMINISTIC FINANCIAL LAYER
     */
    const financials =
      financialEngine.calculate(
        ownCapital
      );

    /*
     * Current scheme rules are provisional.
     */
    const scheme =
      schemeRouter.route(
        financials.projectCost
      );

    /*
     * Phase 0:
     * viability no longer invents cash flow.
     */
    const repayment =
      repaymentPlanner.build(
        financials.loanAmount,
        scheme,
        viability.expectedCashFlow
      );

    const workingCapital =
      workingCapitalPlanner.allocate(
        financials.projectCost,
        businessCategory
      );

    /*
     * RECOMMENDATION
     */
    const rawRecommendation =
      deriveRecommendation(
        viability,
        repayment
      );

    const {
      finalRecommendation,
      gated,
      surfacedAlternatives,
    } =
      applyRecommendationGate({
        rawRecommendation,
        competitorClassification:
          competitorMapping.classification,
        opportunities,
      });

    /*
     * AI EXPLANATION
     *
     * AI receives facts but does not determine them.
     */
    let narrative;

    try {
      narrative =
        await mlClient.explain({
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
            ? "The explanation service is temporarily unavailable. The report explicitly identifies available evidence and data limitations."
            : "The explanation service is temporarily unavailable. The report explicitly identifies available evidence and data limitations.",
      };
    }

    const evidenceSummary = {
      dataPrinciple:
        "Official Government Data → Verified/Recent Local Data → Research/Secondary Data → Transparent Assumptions",

      locationSource:
        geoContext.provenance ||
        {
          source:
            geoContext.dataSource ||
            "unknown",
          authority: "unknown",
          coverage: "unknown",
        },

      competitorCoverage:
        competitorMapping.coverage ||
        "unknown",

      competitorInterpretation:
        competitorMapping.identifiable
          ? "Identifiable competitors found in available data."
          : "No reliable category-specific competitor record was available. This is not proof that competitors do not exist.",

      pricingStatus:
        pricing.estimated
          ? "Estimated fallback"
          : "Observed/ingested local data",

      schemeRuleStatus:
        scheme.ruleStatus ||
        SCHEME_RULE_STATUS,

      schemeRuleWarning:
        "Current financial scheme parameters are provisional until verified against the applicable official scheme guideline.",

      viabilityStatus:
        viability.estimateStatus ||
        "preliminary",

      limitations: [
        ...(viability.dataLimitations || []),

        ...(geoContext.dataAvailabilityNote
          ? [
              geoContext.dataAvailabilityNote,
            ]
          : []),

        ...(pricing.estimated
          ? [
              "Pricing uses a development fallback assumption because sufficiently reliable local price data was unavailable.",
            ]
          : []),

        ...(scheme.ruleStatus ===
        "provisional_assumption"
          ? [
              "Scheme financial parameters have not yet been validated against a current official guideline.",
            ]
          : []),
      ],
    };

    const report = {
      input: {
        location,
        ownCapital,
        businessCategory,
        language,
      },

      viability,

      localMarket:
        geoContext,

      competitorMapping,

      opportunities,

      surfacedAlternatives,

      pricing,

      swot:
        viability.swot ||
        null,

      financials,

      scheme,

      repayment,

      workingCapital,

      risks:
        risks.risks ||
        risks,

      finalRecommendation,

      recommendationGated:
        gated,

      narrative,

      evidenceSummary,
    };

    try {
      const saved =
        await Report.create(
          report
        );

      report.reportId =
        saved._id;
    } catch (persistErr) {
      console.warn(
        "[feasibility] Could not persist report to MongoDB:",
        persistErr.message
      );
    }

    try {
      const loanApplicationId =
        await createLoanApplication({
          reportId:
            report.reportId ||
            "unpersisted",

          userId:
            req.user?.id,

          ownCapital:
            financials.ownCapital,

          projectCost:
            financials.projectCost,

          loanAmount:
            financials.loanAmount,

          scheme,
        });

      if (loanApplicationId) {
        await insertEmiLedger(
          loanApplicationId,
          repayment.repaymentSchedule
        );
      }
    } catch (pgErr) {
      console.warn(
        "[feasibility] Could not persist to PostgreSQL:",
        pgErr.message
      );
    }

    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
}


function deriveRecommendation(
  viability,
  repayment
) {
  const score =
    viability?.score ??
    0;

  const capacity =
    repayment?.repaymentCapacity ??
    "Unknown";

  /*
   * If financial cash-flow evidence is unavailable,
   * do not produce an unconditional "proceed".
   */
  if (
    viability?.expectedCashFlow ==
    null
  ) {
    if (score >= 50) {
      return "proceed_with_caution";
    }

    return "not_recommended";
  }

  if (
    score >= 75 &&
    (
      capacity === "High" ||
      capacity === "Medium"
    )
  ) {
    return "proceed";
  }

  if (score >= 50) {
    return "proceed_with_caution";
  }

  return "not_recommended";
}


module.exports = {
  generate,
  deriveRecommendation,
};