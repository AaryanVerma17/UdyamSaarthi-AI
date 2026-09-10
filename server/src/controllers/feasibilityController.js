const financialEngine =
  require("../services/financialEngine");

const schemeRouter =
  require("../services/schemeRouter");

const repaymentPlanner =
  require("../services/repaymentPlanner");

const workingCapitalPlanner =
  require("../services/workingCapitalPlanner");

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
} = require(
  "../models/postgres/loanApplicationModel"
);

const {
  InvalidInputError,
  AppError,
} = require(
  "../middlewares/errorHandler"
);

const {
  SCHEME_RULE_STATUS,
} = require(
  "../../../shared/constants/schemeRules"
);


/**
 * Preserve useful ML-service diagnostics.
 */
/**
 * Preserve useful ML-service diagnostics.
 *
 * The ML client normalises FastAPI errors into useful
 * MlServiceError objects. Keep those details so that
 * Render logs identify the exact failing stage.
 */
function logMlFailure(operation, error) {
  const details = {
    message:
      error?.message ||
      "Unknown ML service error",

    name:
      error?.name ||
      "Error",

    code:
      error?.code ||
      null,

    status:
      error?.status ??
      error?.response?.status ??
      null,

    operation:
      error?.operation ||
      operation,

    path:
      error?.path ??
      error?.config?.url ??
      null,

    url:
      error?.url ||
      null,

    responseData:
      error?.responseData ??
      error?.response?.data ??
      null,
  };

  console.error(
    `[feasibility] ${operation} failed:`,
    details
  );

  return details;
}


/**
 * Convert an ML-service failure into an AppError
 * while preserving the useful diagnostic message.
 *
 * We intentionally do not expose stack traces or internal
 * implementation details to the frontend.
 */
function mlStageError(operation, error) {
  const details =
    logMlFailure(
      operation,
      error
    );

  const message =
    details.message &&
    details.message !== "Request failed"
      ? details.message
      : `ML service failed during ${operation}`;

  return new AppError(
    `${operation}: ${message}`,
    502
  );
}


async function generate(
  req,
  res,
  next
) {
  try {

    const {
      location,
      ownCapital,
      businessCategory,
      language = "en",
    } = req.body || {};

    // ===============================================================
    // 1. INPUT VALIDATION
    // ===============================================================

    if (
      !location ||
      !location.village ||
      !location.district
    ) {
      throw new InvalidInputError(
        "location.village and location.district are required"
      );
    }

    if (
      typeof businessCategory !== "string" ||
      !businessCategory.trim()
    ) {
      throw new InvalidInputError(
        "businessCategory is required"
      );
    }

    if (
      typeof ownCapital !== "number" ||
      !Number.isFinite(
        ownCapital
      ) ||
      ownCapital <= 0
    ) {
      throw new InvalidInputError(
        "ownCapital must be a positive number"
      );
    }

    const normalizedBusinessCategory =
      businessCategory.trim();


    // ===============================================================
    // 2. LOCATION INTELLIGENCE
    // ===============================================================

    let geoContext;

    // try {
    //   geoContext =
    //     await mlClient.getLocationIntelligence(
    //       location
    //     );
    // } catch (mlErr) {
    //   logMlFailure(
    //     "Location intelligence",
    //     mlErr
    //   );

    //   throw new AppError(
    //     "ml_service failed during location intelligence",
    //     502
    //   );
    // }
    try {
      geoContext =
      await mlClient.getLocationIntelligence(
        location
      );
    } catch (mlErr) {
      throw mlStageError(
        "Location intelligence",
        mlErr
      );
    }

    if (
      !geoContext ||
      typeof geoContext !== "object"
    ) {
      throw new AppError(
        "ml_service returned invalid location intelligence",
        502
      );
    }


    // ===============================================================
    // 3. CATEGORY-SPECIFIC COMPETITION
    // ===============================================================

let competitorMapping;

try {
  competitorMapping = await mlClient.mapCompetitors(
    geoContext,
    normalizedBusinessCategory
  );
} catch (mlErr) {
  throw mlStageError(
    "Competition mapping",
    mlErr
  );
}

// geoContext.competition = {
//   ...(geoContext.competition || {}),
//   ...(competitorMapping || {}),
//   businessCategory:
//     competitorMapping?.businessCategory ||
//     geoContext.competition?.businessCategory ||
//     normalizedBusinessCategory,
// };

    if (
      !competitorMapping ||
      typeof competitorMapping !== "object"
    ) {
      throw new AppError(
        "ml_service returned invalid competition mapping",
        502
      );
    }


    // ===============================================================
    // 4. CORRECTION SCOPE
    // ===============================================================

    const correctionScope = {
      village:
        location.village,

      district:
        location.district,

      businessCategory:
        normalizedBusinessCategory,
    };


    // ===============================================================
    // 5. CONSUMER EVIDENCE + FIELD CORRECTION
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
            (
              Array.isArray(
                geoContext.dataLimitations
              )
                ? geoContext.dataLimitations.join(
                    " "
                  )
                : undefined
            ),
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
    // 6. COMPETITION EVIDENCE + FIELD CORRECTION
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
                : "unknown"
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

          confidence:
            competitorMapping.confidence,

          note:
            competitorMapping.dataConfidenceNote ||
            (
              "Reflects identifiable competitors found using available " +
              "data sources; informal or unlisted businesses may not " +
              "be captured."
            ),
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

    const competitionAvailable =
      Boolean(
        competitorMapping.identifiable
      ) &&
      typeof competitorCountMetric.value ===
        "number" &&
      Number.isFinite(
        competitorCountMetric.value
      );

    if (competitionAvailable) {

      competitorMapping.count =
        competitorCountMetric.value;

      competitorMapping.classification =
        classifyCompetitionCount(
          competitorMapping.count
        );

    } else {

      competitorMapping.count =
        null;

      competitorMapping.identifiable =
        false;

      competitorMapping.classification =
        "data_unavailable";

      competitorMapping.dataConfidenceNote =
        "Category-specific competition evidence is unavailable or incomplete. " +
        "This does not mean that no competitors exist; informal or unlisted " +
        "businesses may not be captured.";
    }

    competitorMapping.countConfidence =
      competitorCountMetric;


    // ===============================================================
    // 7. ATTACH COMPETITION TO GEO CONTEXT
    // ===============================================================

geoContext.competition = {
  businessCategory:
    competitorMapping.businessCategory ||
    normalizedBusinessCategory,

  count:
    competitorMapping.count,

  classification:
    competitorMapping.classification,

  available:
    competitionAvailable,

  identifiable:
    competitionAvailable,

  confidence:
    competitorCountMetric.confidence,

  source:
    competitorMapping.source,

  sourceTier:
    competitorMapping.sourceTier,

  dataYear:
    competitorMapping.dataYear,

  lastUpdated:
    competitorMapping.lastUpdated,

  coverage:
    competitorMapping.coverage,

  geographicMatch:
    competitorMapping.geographicMatch,

  note:
    competitorMapping.dataConfidenceNote,
};


    // ===============================================================
    // 8. DYNAMIC VIABILITY
    // ===============================================================

    let viability;

try {
  viability =
    await mlClient.scoreViability(
      geoContext,
      normalizedBusinessCategory
    );
} catch (mlErr) {
  throw mlStageError(
    "Viability calculation",
    mlErr
  );
}

    if (
      !viability ||
      typeof viability !== "object"
    ) {
      throw new AppError(
        "ml_service returned invalid viability result",
        502
      );
    }


    // ===============================================================
    // 9. OPPORTUNITIES
    // ===============================================================

    let opportunities;

try {
  opportunities =
    await mlClient.rankOpportunities(
      geoContext,
      ownCapital,
      normalizedBusinessCategory
    );
} catch (mlErr) {
  throw mlStageError(
    "Opportunity analysis",
    mlErr
  );
}

    if (
      opportunities?.requestedBusiness
    ) {
      opportunities.requestedBusiness.classification =
        competitorMapping.classification;
    }


    // ===============================================================
    // 10. RISKS
    // ===============================================================

    let risks;

try {
  risks =
    await mlClient.analyzeRisks(
      geoContext,
      normalizedBusinessCategory
    );
} catch (mlErr) {
  throw mlStageError(
    "Risk analysis",
    mlErr
  );
}


    // ===============================================================
    // 11. PRICING
    // ===============================================================

    let pricing;

    try {
      pricing =
        await mlClient.recommendPricing(
          geoContext,
          normalizedBusinessCategory
        );
    } catch (mlErr) {
      logMlFailure(
        "Pricing analysis",
        mlErr
      );

      throw new AppError(
        "ml_service failed during pricing analysis",
        502
      );
    }

    if (
      !Array.isArray(
        pricing?.range
      ) ||
      pricing.range.length !== 2 ||
      pricing.range.some(
        value =>
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
          (
            pricing.range[0] +
            pricing.range[1]
          ) /
          2
        ) *
        100
      ) / 100;

    const priceMetric =
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
              ? pricing.basedOn.join(
                  "; "
                )
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

    pricing.rangeConfidence =
      priceMetric;

    pricing.estimated =
      Boolean(
        priceMetric.estimated
      );

    pricing.confidence =
      priceMetric.confidence;


    // ===============================================================
    // 12. FINANCIAL ENGINE
    // ===============================================================

    const financialBase =
      financialEngine.calculate(
        ownCapital
      );

    const scheme =
      schemeRouter.route(
        financialBase.projectCost
      );

    if (!scheme.ruleStatus) {
      scheme.ruleStatus =
        SCHEME_RULE_STATUS;
    }

    if (!scheme.applicability) {
      scheme.applicability =
        "provisional";
    }

    const financials =
      financialEngine.applySchemeLimit(
        financialBase,
        scheme
      );


    // ===============================================================
    // 13. REPAYMENT
    // ===============================================================

    const expectedCashFlow =
      viability?.expectedCashFlow ??
      null;

    const repayment =
      repaymentPlanner.build(
        financials.loanAmount,
        scheme,
        expectedCashFlow
      );


    // ===============================================================
    // 14. WORKING CAPITAL
    // ===============================================================

    const workingCapital =
      workingCapitalPlanner.allocate(
        financials.projectCost,
        normalizedBusinessCategory
      );


    // ===============================================================
    // 15. RAW RECOMMENDATION
    // ===============================================================

    const rawRecommendation =
      deriveRecommendation(
        viability,
        repayment
      );


    // ===============================================================
    // 16. RECOMMENDATION GATE
    // ===============================================================

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
    // 17. AI EXPLANATION
    // ===============================================================

    let narrative;

    try {
      narrative =
        await mlClient.explain({
          businessCategory:
            normalizedBusinessCategory,

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
    // 18. EVIDENCE SUMMARY
    // ===============================================================

    const evidenceSources = [
      geoContext.dataSource,
      geoContext.provenance?.source,
      consumerBaseMetric.source,
      competitorCountMetric.source,
      priceMetric.source,
    ].filter(Boolean);

    const evidenceLimitations = [
      ...(Array.isArray(
        geoContext.dataLimitations
      )
        ? geoContext.dataLimitations
        : []),

      ...(geoContext.dataAvailabilityNote
        ? [
            geoContext.dataAvailabilityNote,
          ]
        : []),

      ...(Array.isArray(
        viability.dataLimitations
      )
        ? viability.dataLimitations
        : []),

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
    ];

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

      sources:
        [
          ...new Set(
            evidenceSources
          ),
        ],

      competitorCoverage:
        competitorMapping.coverage ||
        "unknown",

      competitorInterpretation:
        competitionAvailable
          ? `${competitorMapping.count} identifiable competitors were found using available data. Informal or unlisted businesses may not be captured.`
          : "Category-specific competition data is unavailable or incomplete. This is not proof that competitors do not exist.",

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
        "planning_estimate",

      limitations:
        [
          ...new Set(
            evidenceLimitations
              .filter(Boolean)
          ),
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


    // ===============================================================
    // 19. FINAL REPORT
    // ===============================================================

    const report = {
      input: {
        location,

        ownCapital,

        businessCategory:
          normalizedBusinessCategory,

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
    // 20. MONGODB PERSISTENCE
    // ===============================================================

    try {

      const saved =
        await Report.create(
          report
        );

      if (saved?._id) {
        report.reportId =
          saved._id;
      }

    } catch (persistErr) {

      console.warn(
        "[feasibility] Could not persist report to MongoDB:",
        persistErr.message
      );
    }


    // ===============================================================
    // 21. POSTGRES LOAN PERSISTENCE
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

      if (
        loanApplicationId &&
        Array.isArray(
          repayment.repaymentSchedule
        )
      ) {
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
    // 22. RESPONSE
    // ===============================================================

    return res
      .status(200)
      .json(report);

  } catch (err) {

    console.error(
      "[feasibility] Report generation failed:",
      {
        message:
          err?.message,

        name:
          err?.name,

        status:
          err?.status ??
          null,

        code:
          err?.code ??
          null,
      }
    );

    return next(err);
  }
}


/**
 * Derive raw recommendation before
 * recommendation gating.
 *
 * Competition saturation alone does NOT
 * automatically reject a business.
 */
function deriveRecommendation(
  viability,
  repayment
) {
  const score =
    typeof viability?.score === "number" &&
    Number.isFinite(
      viability.score
    )
      ? viability.score
      : 0;

  const capacity =
    repayment?.repaymentCapacity ||
    "Unknown";

  // ---------------------------------------------------------------
  // Missing cash-flow evidence
  // ---------------------------------------------------------------

  if (
    viability?.expectedCashFlow == null
  ) {
    if (score >= 50) {
      return "proceed_with_caution";
    }

    return "not_recommended";
  }

  // ---------------------------------------------------------------
  // Strong viability + acceptable repayment
  // ---------------------------------------------------------------

  if (
    score >= 75 &&
    (
      capacity === "High" ||
      capacity === "Medium"
    )
  ) {
    return "proceed";
  }

  // ---------------------------------------------------------------
  // Moderate viability
  // ---------------------------------------------------------------

  if (score >= 50) {
    return "proceed_with_caution";
  }

  // ---------------------------------------------------------------
  // Low viability
  // ---------------------------------------------------------------

  return "not_recommended";
}


module.exports = {
  generate,
  deriveRecommendation,
};