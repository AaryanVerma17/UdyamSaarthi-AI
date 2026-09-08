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
} = require(
  "../../../shared/constants/schemeRules"
);


/**
 * Master feasibility orchestration.
 *
 * PHASE 0 / PHASE 3 principles:
 *
 * 1. Never convert missing data into factual zero.
 * 2. Never represent provisional financial rules as verified government rules.
 * 3. Preserve source/provenance metadata.
 * 4. Make uncertainty visible in the final report.
 * 5. Deterministic engines remain deterministic.
 * 6. AI remains explanation-only.
 * 7. Confidence is separate from viability.
 */
async function generate(req, res, next) {
  try {
    const {
      location,
      ownCapital,
      businessCategory,
      language = "en",
    } = req.body;

    // ---------------------------------------------------------------
    // INPUT VALIDATION
    // ---------------------------------------------------------------

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

    // ---------------------------------------------------------------
    // ML LAYER
    // ---------------------------------------------------------------

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

    // ---------------------------------------------------------------
    // CORRECTION SCOPE
    // ---------------------------------------------------------------

    const correctionScope = {
      village: location.village,
      district: location.district,
      businessCategory,
    };

    // ===============================================================
    // 1. CONSUMER BASE EVIDENCE
    // ===============================================================

    const consumerEvidence =
      geoContext.evidence?.consumerBase;

    let consumerBaseMetric =
      wrapMetric(
        geoContext.consumerBase,
        {
          source:
            consumerEvidence?.source ||
            geoContext.provenance?.source ||
            geoContext.dataSource ||
            "unknown",

          sourceTier:
            consumerEvidence?.sourceTier,

          sourceType:
            consumerEvidence?.sourceType ||
            geoContext.provenance?.sourceType,

          authority:
            consumerEvidence?.authorityScore ??
            geoContext.provenance?.authority,

          dataYear:
            consumerEvidence?.dataYear ??
            geoContext.provenance?.dataYear,

          lastUpdated:
            consumerEvidence?.lastUpdated ||
            geoContext.lastUpdated ||
            geoContext.provenance?.lastUpdated,

          geographicMatch:
            consumerEvidence?.geographicMatch ||
            geoContext.provenance?.geographicMatch ||
            "unknown",

          coverage:
            consumerEvidence?.coverage ||
            geoContext.provenance?.coverage ||
            "unknown",

          isAssumption:
            consumerEvidence?.isAssumption ??
            geoContext.provenance?.estimated ??
            !geoContext.isExactLocationMatch,

          estimated:
            consumerEvidence?.estimated ??
            consumerEvidence?.isAssumption ??
            geoContext.provenance?.estimated ??
            !geoContext.isExactLocationMatch,

          note:
            consumerEvidence?.notes ||
            consumerEvidence?.note ||
            geoContext.provenance?.note ||
            geoContext.dataAvailabilityNote ||
            geoContext.dataLimitations?.join(" "),
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

    // ===============================================================
    // 2. COMPETITOR EVIDENCE
    // ===============================================================

    let competitorCountMetric =
      wrapMetric(
        competitorMapping.count,
        {
          source:
            competitorMapping.source ||
            (
              competitorMapping.lastUpdated
                ? "ingested business listing"
                : "estimated"
            ),

          sourceTier:
            competitorMapping.sourceTier,

          sourceType:
            competitorMapping.sourceType ||
            (
              competitorMapping.identifiable
                ? "identifiable_business_records"
                : "unavailable"
            ),

          authority:
            competitorMapping.authorityScore ??
            geoContext.provenance?.authority,

          dataYear:
            competitorMapping.dataYear,

          lastUpdated:
            competitorMapping.lastUpdated,

          geographicMatch:
            competitorMapping.geographicMatch ||
            geoContext.provenance?.geographicMatch ||
            "unknown",

          coverage:
            competitorMapping.coverage ||
            "partial",

          isAssumption:
            competitorMapping.isAssumption ??
            !competitorMapping.identifiable,

          estimated:
            competitorMapping.estimated ??
            competitorMapping.isAssumption ??
            !competitorMapping.identifiable,

          note:
            competitorMapping.dataConfidenceNote ||
            "Reflects identifiable competitors found using available data sources; informal or unlisted businesses may not be captured.",
        }
      );

    competitorCountMetric =
      applyCorrection(
        competitorCountMetric,
        buildCorrectionKey({
          ...correctionScope,
          metric: "competitorCount",
        })
      );

    competitorMapping.count =
      competitorCountMetric.value;

    competitorMapping.countConfidence =
      competitorCountMetric;

    // ---------------------------------------------------------------
    // IMPORTANT:
    // Do not interpret unavailable count = 0 competitors.
    // ---------------------------------------------------------------

    if (
      competitorMapping.identifiable ||
      competitorCountMetric.verified
    ) {
      competitorMapping.classification =
        classifyCompetitionCount(
          competitorMapping.count
        );
    } else {
      competitorMapping.classification =
        "under_served";

      competitorMapping.dataConfidenceNote =
        "No identifiable competitors were found in the available data. " +
        "This does not mean that no competitors exist in reality; " +
        "informal or unlisted businesses may not be captured.";
    }

    // ---------------------------------------------------------------
    // Keep opportunities aligned with competition result.
    // ---------------------------------------------------------------

    if (
      opportunities?.requestedBusiness
    ) {
      opportunities.requestedBusiness.classification =
        competitorMapping.classification;
    }

    // ===============================================================
    // 3. PRICING EVIDENCE
    // ===============================================================

    if (
      !Array.isArray(pricing?.range) ||
      pricing.range.length !== 2 ||
      pricing.range.some(
        (value) =>
          typeof value !== "number" ||
          !Number.isFinite(value)
      )
    ) {
      throw new AppError(
        "ml_service returned an invalid pricing range",
        502
      );
    }

    const priceMidpoint =
      Math.round(
        (
          pricing.range[0] +
          pricing.range[1]
        ) /
          2 *
          100
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
              : pricing.basedOn ||
                "unknown",

          sourceTier:
            pricing.sourceTier,

          sourceType:
            pricing.sourceType ||
            "unknown",

          authority:
            pricing.authorityScore,

          dataYear:
            pricing.dataYear,

          lastUpdated:
            pricing.lastUpdated,

          geographicMatch:
            pricing.geographicMatch ||
            "unknown",

          coverage:
            pricing.coverage ||
            "partial",

          isAssumption:
            pricing.isAssumption ??
            pricing.estimated ??
            pricing.confidence === "low",

          estimated:
            pricing.estimated ??
            pricing.isAssumption ??
            pricing.confidence === "low",

          confidence:
            pricing.confidence,
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

    // A verified field correction replaces the midpoint.
    if (priceMetric.verified) {
      pricing.range = [
        priceMetric.value,
        priceMetric.value,
      ];
    }

    pricing.rangeConfidence =
      priceMetric;

    // Explicit convenience flags for frontend.
    pricing.estimated =
      Boolean(priceMetric.estimated);

    pricing.confidence =
      priceMetric.confidence;

    // ===============================================================
    // 4. DETERMINISTIC FINANCIAL LAYER
    // ===============================================================

    const financials =
      financialEngine.calculate(
        ownCapital
      );

    // ---------------------------------------------------------------
    // Scheme rules are currently provisional.
    // ---------------------------------------------------------------

    const scheme =
      schemeRouter.route(
        financials.projectCost
      );

    // Guarantee provisional status is surfaced.
    if (!scheme.ruleStatus) {
      scheme.ruleStatus =
        SCHEME_RULE_STATUS;
    }

    if (!scheme.applicability) {
      scheme.applicability =
        "provisional";
    }

    // ===============================================================
    // 5. REPAYMENT
    // ===============================================================

    const repayment =
      repaymentPlanner.build(
        financials.loanAmount,
        scheme,
        viability.expectedCashFlow
      );

    // ===============================================================
    // 6. WORKING CAPITAL
    // ===============================================================

    const workingCapital =
      workingCapitalPlanner.allocate(
        financials.projectCost,
        businessCategory
      );

    // ===============================================================
    // 7. RECOMMENDATION
    // ===============================================================

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

    // ===============================================================
    // 8. AI EXPLANATION
    // ===============================================================

    /*
     * AI receives facts.
     *
     * AI does NOT:
     * - calculate viability
     * - calculate financials
     * - determine scheme eligibility
     * - override evidence confidence
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
      console.warn(
        "[feasibility] Explanation service unavailable:",
        explainErr.message
      );

      narrative = {
        language,

        text:
          language === "hi"
            ? "व्याख्या सेवा अस्थायी रूप से उपलब्ध नहीं है। रिपोर्ट में उपलब्ध साक्ष्य और डेटा सीमाओं को स्पष्ट रूप से दिखाया गया है।"
            : "The explanation service is temporarily unavailable. The report explicitly identifies available evidence and data limitations.",
      };
    }

    // ===============================================================
    // 9. EVIDENCE SUMMARY
    // ===============================================================

    const evidenceSummary = {
      dataPrinciple:
        "Official Government Data → Verified/Recent Local Data → Research/Secondary Data → Transparent Assumptions",

      overallConfidence:
        geoContext.dataConfidence ||
        "low",

      locationMatch:
        geoContext.isExactLocationMatch
          ? "exact"
          : "not_found",

      locationSource:
        geoContext.provenance ||
        {
          source:
            geoContext.dataSource ||
            "unknown",

          sourceType:
            "unknown",

          authority:
            "unknown",

          coverage:
            "unknown",
        },

      sources: [
        ...new Set(
          [
            geoContext.dataSource,
            geoContext.provenance?.source,
            consumerBaseMetric.source,
            competitorCountMetric.source,
            priceMetric.source,
          ].filter(Boolean)
        ),
      ],

      competitorCoverage:
        competitorMapping.coverage ||
        "unknown",

      competitorInterpretation:
        competitorMapping.identifiable ||
        competitorCountMetric.verified
          ? "Identifiable competitors were found in available data. Informal or unlisted businesses may not be captured."
          : "No reliable category-specific competitor record was available. This is not proof that competitors do not exist.",

      pricingStatus:
        priceMetric.estimated
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
        ...(geoContext.dataLimitations || []),

        ...(geoContext.dataAvailabilityNote
          ? [
              geoContext.dataAvailabilityNote,
            ]
          : []),

        ...(viability.dataLimitations || []),

        ...(competitorMapping.dataConfidenceNote
          ? [
              competitorMapping.dataConfidenceNote,
            ]
          : []),

        ...(priceMetric.estimated
          ? [
              "Pricing uses a development fallback assumption because sufficiently reliable local price data was unavailable.",
            ]
          : []),

        ...(scheme.ruleStatus ===
        "provisional_assumption"
          ? [
              "Scheme financial parameters have not yet been validated against a current official scheme guideline.",
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

    // Remove duplicate limitations.
    evidenceSummary.limitations =
      [
        ...new Set(
          evidenceSummary.limitations
            .filter(Boolean)
        ),
      ];

    // ===============================================================
    // 10. FINAL REPORT
    // ===============================================================

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

    // ===============================================================
    // 11. MONGODB PERSISTENCE
    // ===============================================================

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

    // ===============================================================
    // 12. POSTGRES LOAN PERSISTENCE
    // ===============================================================

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

    // ===============================================================
    // RESPONSE
    // ===============================================================

    res
      .status(200)
      .json(report);

  } catch (err) {
    next(err);
  }
}


/**
 * Derive the raw recommendation before the
 * recommendation gate applies additional safeguards.
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