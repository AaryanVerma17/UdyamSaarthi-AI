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

const mlClient = require("../clients/mlServiceClient");
const Report = require("../models/Report");

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
} = require("../../../shared/constants/schemeRules");


/**
 * Master feasibility orchestration.
 *
 * PHASE 5 ORDER:
 *
 * Location
 *    ↓
 * Competition
 *    ↓
 * Verified competition correction
 *    ↓
 * Competition classification
 *    ↓
 * geoContext.competition
 *    ↓
 * Viability
 *    ↓
 * Opportunities
 *    ↓
 * Risk
 *    ↓
 * Pricing
 *    ↓
 * Financials
 *    ↓
 * Recommendation
 *    ↓
 * AI explanation
 *
 * Important:
 * A competition count represents identifiable businesses
 * found using available evidence. It is NOT a claim that
 * every business in the real world has been captured.
 */
async function generate(req, res, next) {
  try {
    const {
      location,
      ownCapital,
      businessCategory,
      language = "en",
    } = req.body;

    // --------------------------------------------------
    // Input validation
    // --------------------------------------------------

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
      !Number.isFinite(ownCapital) ||
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

    // --------------------------------------------------
    // ML orchestration
    // --------------------------------------------------

    try {
      // ------------------------------------------------
      // Module 1 — Location intelligence
      // ------------------------------------------------

      geoContext =
        await mlClient.getLocationIntelligence(
          location
        );

      // ------------------------------------------------
      // Module 3 — Competition
      //
      // Competition is intentionally executed BEFORE
      // viability so that viability receives the
      // category-specific competition context.
      // ------------------------------------------------

      competitorMapping =
        await mlClient.mapCompetitors(
          geoContext,
          businessCategory
        );

      // ------------------------------------------------
      // Competition correction
      //
      // Verified local information can override weaker
      // online/listed evidence.
      // ------------------------------------------------

      const correctionScope = {
        village: location.village,
        district: location.district,
        businessCategory,
      };

      // ------------------------------------------------
      // Wrap competition evidence with provenance
      // ------------------------------------------------

      let competitorCountMetric =
        wrapMetric(
          competitorMapping.count,
          {
            source:
              competitorMapping.source ||
              (
                competitorMapping.lastUpdated
                  ? "ingested business listing"
                  : "unknown"
              ),

            sourceTier:
              competitorMapping.sourceTier,

            dataYear:
              competitorMapping.dataYear,

            lastUpdated:
              competitorMapping.lastUpdated,

            geographicMatch:
              competitorMapping.geographicMatch ||
              "unknown",

            coverage:
              competitorMapping.coverage ||
              "partial",

            isAssumption:
              competitorMapping.identifiable === false,

            estimated:
              competitorMapping.identifiable === false,

            note:
              competitorMapping.dataConfidenceNote ||
              (
                "Competition reflects identifiable " +
                "businesses found using available data. " +
                "Informal or unlisted businesses may " +
                "not be captured."
              ),
          }
        );

      // ------------------------------------------------
      // Apply verified field correction ONCE
      // ------------------------------------------------

      competitorCountMetric =
        applyCorrection(
          competitorCountMetric,
          buildCorrectionKey({
            ...correctionScope,
            metric: "competitorCount",
          })
        );

      // ------------------------------------------------
      // Update competition response
      // ------------------------------------------------

      competitorMapping.count =
        competitorCountMetric.value;

      competitorMapping.countConfidence =
        competitorCountMetric;

      // ------------------------------------------------
      // Reclassify after correction
      // ------------------------------------------------

      competitorMapping.classification =
        classifyCompetitionCount(
          competitorMapping.count
        );

      // ------------------------------------------------
      // Explicit unavailable state
      //
      // null means "unknown / unavailable", NOT zero.
      // ------------------------------------------------

      if (
        competitorMapping.count === null ||
        competitorMapping.count === undefined
      ) {
        competitorMapping.classification =
          "data_unavailable";

        competitorMapping.identifiable =
          false;

        competitorMapping.dataConfidenceNote =
          competitorMapping.dataConfidenceNote ||
          (
            "No category-specific competitor " +
            "data was available for this location. " +
            "This does not mean that no competitors " +
            "exist in reality."
          );
      }

      // ------------------------------------------------
      // Pass corrected competition into downstream ML
      // ------------------------------------------------

      geoContext.competition = {
        businessCategory,

        identifiable:
          competitorMapping.identifiable,

        count:
          competitorMapping.count,

        classification:
          competitorMapping.classification,

        confidence:
          competitorMapping.confidence ||
          competitorCountMetric.confidence,

        source:
          competitorMapping.source,

        sourceTier:
          competitorMapping.sourceTier,

        coverage:
          competitorMapping.coverage,

        geographicMatch:
          competitorMapping.geographicMatch,

        dataConfidenceNote:
          competitorMapping.dataConfidenceNote,
      };

      // ------------------------------------------------
      // Module 2 — Viability
      //
      // Receives corrected, category-specific
      // competition context.
      // ------------------------------------------------

      viability =
        await mlClient.scoreViability(
          geoContext,
          businessCategory
        );

      // ------------------------------------------------
      // Module 4 — Opportunities
      // ------------------------------------------------

      opportunities =
        await mlClient.rankOpportunities(
          geoContext,
          ownCapital,
          businessCategory
        );

      // ------------------------------------------------
      // Module 9 — Risk
      // ------------------------------------------------

      risks =
        await mlClient.analyzeRisks(
          geoContext,
          businessCategory
        );

      // ------------------------------------------------
      // Module 10 — Pricing
      // ------------------------------------------------

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

    // --------------------------------------------------
    // Confidence / correction scope
    // --------------------------------------------------

    const correctionScope = {
      village: location.village,
      district: location.district,
      businessCategory,
    };

    // --------------------------------------------------
    // Consumer base evidence
    // --------------------------------------------------

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

          dataYear:
            geoContext.provenance?.dataYear,

          lastUpdated:
            geoContext.lastUpdated,

          coverage:
            geoContext.provenance?.coverage ||
            "unknown",

          geographicPrecision:
            geoContext.provenance?.geographicPrecision ||
            "unknown",

          geographicMatch:
            geoContext.isExactLocationMatch
              ? "exact"
              : "unknown",

          completeness:
            geoContext.provenance?.completeness ||
            "unknown",

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
          metric: "consumerBase",
        })
      );

    geoContext.consumerBase =
      consumerBaseMetric.value;

    geoContext.consumerBaseConfidence =
      consumerBaseMetric;

    // --------------------------------------------------
    // Competition confidence
    //
    // DO NOT apply correction again.
    // Competition correction already happened before
    // viability and risk.
    // --------------------------------------------------

    competitorMapping.countConfidence =
      competitorCountMetric;

    competitorMapping.classification =
      classifyCompetitionCount(
        competitorMapping.count
      );

    if (
      competitorMapping.count === null ||
      competitorMapping.count === undefined
    ) {
      competitorMapping.classification =
        "data_unavailable";
    }

    // --------------------------------------------------
    // Keep opportunities aligned with the corrected
    // requested-business competition classification.
    // --------------------------------------------------

    if (opportunities?.requestedBusiness) {
      opportunities.requestedBusiness.classification =
        competitorMapping.classification;
    }

    // --------------------------------------------------
    // Pricing evidence
    // --------------------------------------------------

    let priceMetric = null;

    if (
      Array.isArray(pricing?.range) &&
      pricing.range.length >= 2
    ) {
      const minPrice =
        Number(pricing.range[0]);

      const maxPrice =
        Number(pricing.range[1]);

      if (
        Number.isFinite(minPrice) &&
        Number.isFinite(maxPrice) &&
        minPrice >= 0 &&
        maxPrice >= minPrice
      ) {
        const priceMidpoint =
          Math.round(
            (
              (minPrice + maxPrice) / 2
            ) * 100
          ) / 100;

        priceMetric =
          wrapMetric(
            priceMidpoint,
            {
              min: minPrice,

              max: maxPrice,

              source:
                Array.isArray(pricing.basedOn)
                  ? pricing.basedOn.join("; ")
                  : pricing.basedOn,

              sourceType:
                pricing.sourceType ||
                "unknown",

              sourceTier:
                pricing.sourceTier,

              authority:
                pricing.authorityScore,

              dataYear:
                pricing.dataYear,

              geographicMatch:
                pricing.geographicMatch ||
                "unknown",

              coverage:
                pricing.coverage ||
                "partial",

              lastUpdated:
                pricing.lastUpdated,

              estimated:
                pricing.estimated ??
                pricing.isAssumption ??
                false,
            }
          );

        priceMetric =
          applyCorrection(
            priceMetric,
            buildCorrectionKey({
              ...correctionScope,
              metric: "priceRange",
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
      }
    }

    // --------------------------------------------------
    // Module 5 — Financial engine
    // --------------------------------------------------

    const financials =
      financialEngine.calculate(
        ownCapital
      );

    // --------------------------------------------------
    // Module 6 — Government scheme
    // --------------------------------------------------

    const scheme =
      schemeRouter.route(
        financials.projectCost
      );

    // --------------------------------------------------
    // Module 7 — Repayment
    // --------------------------------------------------

    const repayment =
      repaymentPlanner.build(
        financials.loanAmount,
        scheme,
        viability.expectedCashFlow
      );

    // --------------------------------------------------
    // Module 8 — Working capital
    // --------------------------------------------------

    const workingCapital =
      workingCapitalPlanner.allocate(
        financials.projectCost,
        businessCategory
      );

    // --------------------------------------------------
    // Recommendation
    // --------------------------------------------------

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

    // --------------------------------------------------
    // AI Advisor
    //
    // Explanation only.
    //
    // AI receives already-corrected facts.
    // --------------------------------------------------

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
      console.warn(
        "[feasibility] Explanation service unavailable:",
        explainErr.message
      );

      narrative = {
        language,

        text:
          language === "hi"
            ? (
                "व्याख्या सेवा अभी उपलब्ध नहीं है। " +
                "रिपोर्ट में उपलब्ध डेटा, " +
                "प्रतिस्पर्धा और वित्तीय परिणाम " +
                "अलग से दिखाए गए हैं।"
              )
            : (
                "The explanation service is " +
                "temporarily unavailable. The " +
                "available evidence, competition " +
                "and financial results are shown " +
                "separately in the report."
              ),
      };
    }

    // --------------------------------------------------
    // Evidence summary
    // --------------------------------------------------

    const evidenceSummary = {
      overallConfidence:
        geoContext.dataConfidence ||
        "low",

      locationMatch:
        geoContext.isExactLocationMatch
          ? "exact"
          : "not_found",

      sources: [
        ...new Set(
          [
            geoContext.dataSource,
            consumerBaseMetric.source,
            competitorMapping.source,
            priceMetric?.source,
          ].filter(Boolean)
        ),
      ],

      limitations: [
        ...(geoContext.dataLimitations || []),

        ...(competitorMapping.dataConfidenceNote
          ? [
              competitorMapping.dataConfidenceNote,
            ]
          : []),
      ],

      metrics: {
        consumerBase:
          consumerBaseMetric,

        competitorCount:
          competitorCountMetric,

        price:
          priceMetric,
      },
    };

    // --------------------------------------------------
    // Final report
    // --------------------------------------------------

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
        risks?.risks ||
        risks,

      finalRecommendation,

      recommendationGated:
        gated,

      narrative,

      evidenceSummary,
    };

    // --------------------------------------------------
    // MongoDB persistence
    // --------------------------------------------------

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

    // --------------------------------------------------
    // PostgreSQL persistence
    // --------------------------------------------------

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

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return res
      .status(200)
      .json(report);

  } catch (err) {
    next(err);
  }
}


/**
 * Convert viability + repayment capacity
 * into the raw recommendation.
 *
 * The recommendation gate later applies
 * competition constraints.
 */
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

  if (
    score >= 75 &&
    (
      capacity === "High" ||
      capacity === "Medium"
    )
  ) {
    return "proceed";
  }

  if (
    score >= 50
  ) {
    return "proceed_with_caution";
  }

  return "not_recommended";
}


module.exports = {
  generate,
};