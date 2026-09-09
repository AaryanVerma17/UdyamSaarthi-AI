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
 * Master feasibility orchestration.
 *
 * Phase 7:
 *
 * Location
 *   ↓
 * Competition
 *   ↓
 * Field correction
 *   ↓
 * Category-specific competition
 *   ↓
 * Viability
 *   ↓
 * Opportunities
 *   ↓
 * Financial Engine
 *   ↓
 * Scheme Router
 *   ↓
 * Repayment Planner
 *   ↓
 * Working Capital
 *   ↓
 * Risk
 *   ↓
 * Pricing
 *   ↓
 * Recommendation
 *   ↓
 * Explanation
 */
async function generate(
  req,
  res,
  next
) {

  try {

    // =============================================================
    // 1. INPUT
    // =============================================================

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
      !Number.isFinite(
        ownCapital
      ) ||
      ownCapital <= 0
    ) {

      throw new InvalidInputError(
        "ownCapital must be a positive number"
      );
    }


    // =============================================================
    // 2. LOCATION
    // =============================================================

    let geoContext;

    try {

      geoContext =
        await mlClient.getLocationIntelligence(
          location
        );

    } catch (err) {

      console.error(
        "[feasibility] Location intelligence failed:",
        err
      );

      throw new AppError(
        "ml_service failed during location intelligence",
        502
      );
    }


    // =============================================================
    // 3. COMPETITION
    // =============================================================

    let competitorMapping;

    try {

      competitorMapping =
        await mlClient.mapCompetitors(
          geoContext,
          businessCategory
        );

    } catch (err) {

      console.error(
        "[feasibility] Competition mapping failed:",
        err
      );

      throw new AppError(
        "ml_service failed during competition mapping",
        502
      );
    }


    // =============================================================
    // 4. SINGLE CORRECTION SCOPE
    // =============================================================

    const correctionScope = {

      village:
        location.village,

      district:
        location.district,

      businessCategory,
    };


    // =============================================================
    // 5. COMPETITION EVIDENCE
    // =============================================================

    let competitorCountMetric =
      wrapMetric(
        competitorMapping.count,
        {

          source:
            competitorMapping.source ||
            "unknown",

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
            competitorMapping.authorityScore,

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

          confidence:
            competitorMapping.confidence,

          note:
            competitorMapping.dataConfidenceNote ||
            (
              "Competition reflects identifiable businesses " +
              "found using available data. Informal or " +
              "unlisted businesses may not be captured."
            ),
        }
      );


    // =============================================================
    // 6. APPLY FIELD CORRECTION ONCE
    // =============================================================

    competitorCountMetric =
      applyCorrection(
        competitorCountMetric,

        buildCorrectionKey({
          ...correctionScope,
          metric:
            "competitorCount",
        })
      );


    // =============================================================
    // 7. COMPETITION RESULT
    // =============================================================

    const competitionCount =
      competitorCountMetric.value;


    const competitionAvailable =
      typeof competitionCount ===
        "number" &&
      Number.isFinite(
        competitionCount
      );


    competitorMapping.count =
      competitionAvailable
        ? competitionCount
        : null;


    competitorMapping.countConfidence =
      competitorCountMetric;


    if (
      competitionAvailable
    ) {

      competitorMapping.identifiable =
        true;

      competitorMapping.classification =
        classifyCompetitionCount(
          competitionCount
        );

    } else {

      competitorMapping.identifiable =
        false;

      competitorMapping.classification =
        "data_unavailable";

      competitorMapping.dataConfidenceNote =
        (
          competitorMapping.dataConfidenceNote ||
          "Category-specific competition data is unavailable. "
        ) +
        "This does not mean that no competitors exist; " +
        "informal or unlisted businesses may not be captured.";
    }


    // =============================================================
    // 8. ATTACH COMPETITION TO GEO CONTEXT
    // =============================================================

    geoContext.competition = {

      businessCategory,

      count:
        competitorMapping.count,

      identifiable:
        competitorMapping.identifiable,

      classification:
        competitorMapping.classification,

      available:
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

      geographicMatch:
        competitorMapping.geographicMatch,

      coverage:
        competitorMapping.coverage,

      dataConfidenceNote:
        competitorMapping.dataConfidenceNote,
    };


    // =============================================================
    // 9. VIABILITY
    // =============================================================
    //
    // Competition MUST already be inside geoContext.
    //

    let viability;

    try {

      viability =
        await mlClient.scoreViability(
          geoContext,
          businessCategory
        );

    } catch (err) {

      console.error(
        "[feasibility] Viability failed:",
        err
      );

      throw new AppError(
        "ml_service failed during viability calculation",
        502
      );
    }


    // =============================================================
    // 10. OPPORTUNITIES
    // =============================================================

    let opportunities;

    try {

      opportunities =
        await mlClient.rankOpportunities(
          geoContext,
          ownCapital,
          businessCategory
        );

    } catch (err) {

      console.error(
        "[feasibility] Opportunity analysis failed:",
        err
      );

      throw new AppError(
        "ml_service failed during opportunity analysis",
        502
      );
    }


    if (
      opportunities?.requestedBusiness
    ) {

      opportunities
        .requestedBusiness
        .classification =
          competitorMapping.classification;
    }


    // =============================================================
    // 11. FINANCIAL ENGINE
    // =============================================================
    //
    // This is intentionally calculated BEFORE repayment.
    //

    const financialBase =
      financialEngine.calculate(
        ownCapital
      );


    // =============================================================
    // 12. SCHEME ROUTER
    // =============================================================

    const scheme =
      schemeRouter.route(
        financialBase.projectCost
      );


    // Ensure scheme status is visible.
    scheme.ruleStatus =
      scheme.ruleStatus ||
      SCHEME_RULE_STATUS;


    scheme.applicability =
      scheme.applicability ||
      "provisional";


    // =============================================================
    // 13. APPLY SCHEME LIMIT
    // =============================================================

    const financials =
      financialEngine.applySchemeLimit(
        financialBase,
        scheme
      );


    // =============================================================
    // 14. REPAYMENT
    // =============================================================

    const expectedCashFlow =
      viability?.expectedCashFlow ??
      null;


    const repayment =
      repaymentPlanner.build(
        financials.loanAmount,
        scheme,
        expectedCashFlow
      );


    // =============================================================
    // 15. WORKING CAPITAL
    // =============================================================

    const workingCapital =
      workingCapitalPlanner.allocate(
        financials.projectCost,
        businessCategory
      );


    // =============================================================
    // 16. RISK
    // =============================================================

    let risks;

    try {

      risks =
        await mlClient.analyzeRisks(
          geoContext,
          businessCategory
        );

    } catch (err) {

      console.error(
        "[feasibility] Risk analysis failed:",
        err
      );

      throw new AppError(
        "ml_service failed during risk analysis",
        502
      );
    }


    // =============================================================
    // 17. PRICING
    // =============================================================

    let pricing;

    try {

      pricing =
        await mlClient.recommendPricing(
          geoContext,
          businessCategory
        );

    } catch (err) {

      console.error(
        "[feasibility] Pricing analysis failed:",
        err
      );

      throw new AppError(
        "ml_service failed during pricing analysis",
        502
      );
    }


    // =============================================================
    // 18. PRICING EVIDENCE
    // =============================================================

    let priceMetric = null;


    if (
      Array.isArray(
        pricing?.range
      ) &&
      pricing.range.length >= 2
    ) {

      const minPrice =
        Number(
          pricing.range[0]
        );


      const maxPrice =
        Number(
          pricing.range[1]
        );


      if (
        Number.isFinite(
          minPrice
        ) &&
        Number.isFinite(
          maxPrice
        ) &&
        minPrice >= 0 &&
        maxPrice >= minPrice
      ) {

        const priceMidpoint =
          Math.round(
            (
              (
                minPrice +
                maxPrice
              ) / 2
            ) * 100
          ) / 100;


        priceMetric =
          wrapMetric(
            priceMidpoint,
            {

              min:
                minPrice,

              max:
                maxPrice,

              source:
                Array.isArray(
                  pricing.basedOn
                )
                  ? pricing.basedOn.join(
                      "; "
                    )
                  : pricing.basedOn ||
                    "unknown",

              sourceType:
                pricing.sourceType ||
                "unknown",

              sourceTier:
                pricing.sourceTier,

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

              estimated:
                pricing.estimated ??
                pricing.isAssumption ??
                false,

              confidence:
                pricing.confidence,
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


        if (
          priceMetric.verified
        ) {

          pricing.range = [
            priceMetric.value,
            priceMetric.value,
          ];
        }


        pricing.rangeConfidence =
          priceMetric;


        pricing.estimated =
          Boolean(
            priceMetric.estimated
          );


        pricing.confidence =
          priceMetric.confidence;
      }
    }


    // =============================================================
    // 19. FINAL RECOMMENDATION
    // =============================================================

    const rawRecommendation =
      deriveRecommendation(
        viability,
        repayment,
        financials
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


    // =============================================================
    // 20. AI EXPLANATION
    // =============================================================

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

    } catch (err) {

      console.warn(
        "[feasibility] Explanation service unavailable:",
        err.message
      );


      narrative = {

        language,

        text:
          language === "hi"
            ? (
                "व्याख्या सेवा अभी उपलब्ध नहीं है। " +
                "रिपोर्ट में उपलब्ध डेटा, प्रतिस्पर्धा " +
                "और वित्तीय परिणाम दिखाए गए हैं।"
              )
            : (
                "The explanation service is temporarily " +
                "unavailable. Available evidence, competition " +
                "and financial results are shown in the report."
              ),
      };
    }


    // =============================================================
    // 21. EVIDENCE SUMMARY
    // =============================================================

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

            geoContext.provenance?.source,

            consumerBaseMetric.source,

            competitorCountMetric.source,

            priceMetric?.source,
          ].filter(Boolean)
        ),
      ],


      competitorCoverage:
        competitorMapping.coverage ||
        "unknown",


      competitorInterpretation:
        competitionAvailable
          ? (
              `${competitorMapping.count} identifiable ` +
              "competitors were found using available data. " +
              "Informal or unlisted businesses may not be captured."
            )
          : (
              "Category-specific competition data is unavailable " +
              "or incomplete. This is not proof that competitors " +
              "do not exist."
            ),


      pricingStatus:
        priceMetric?.estimated
          ? "Estimated fallback"
          : "Observed/ingested local data",


      schemeRuleStatus:
        scheme.ruleStatus ||
        SCHEME_RULE_STATUS,


      schemeRuleWarning:
        "Scheme parameters are provisional until verified " +
        "against the applicable official government guideline.",


      viabilityStatus:
        viability.estimateStatus ||
        "planning_estimate",


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

        ...(priceMetric?.estimated
          ? [
              "Pricing uses an estimated fallback because " +
              "sufficiently reliable local price data was unavailable.",
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


    evidenceSummary.limitations =
      [
        ...new Set(
          evidenceSummary.limitations
            .filter(Boolean)
        ),
      ];


    // =============================================================
    // 22. FINAL REPORT
    // =============================================================

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
        viability?.swot ||
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


    // =============================================================
    // 23. MONGODB
    // =============================================================

    try {

      const saved =
        await Report.create(
          report
        );


      report.reportId =
        saved._id;

    } catch (err) {

      console.warn(
        "[feasibility] MongoDB persistence skipped:",
        err.message
      );
    }


    // =============================================================
    // 24. POSTGRESQL
    // =============================================================

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
        loanApplicationId
      ) {

        await insertEmiLedger(
          loanApplicationId,
          repayment.repaymentSchedule
        );
      }

    } catch (err) {

      console.warn(
        "[feasibility] PostgreSQL persistence skipped:",
        err.message
      );
    }


    // =============================================================
    // 25. RESPONSE
    // =============================================================

    return res
      .status(200)
      .json(report);

  } catch (err) {

    next(err);
  }
}


/**
 * Raw recommendation before the recommendation gate.
 *
 * Phase 7 decision considers:
 *
 * Viability
 * + Repayment capacity
 * + Scheme feasibility
 * + Funding gap
 *
 * Saturation alone does not reject a business.
 */
function deriveRecommendation(
  viability,
  repayment,
  financials
) {

  const score =
    Number(
      viability?.score ??
      0
    );


  const capacity =
    repayment?.repaymentCapacity ??
    "Unknown";


  const schemeFeasible =
    financials?.schemeFeasible !==
    false;


  const fundingGap =
    Number(
      financials?.fundingGap ??
      0
    );


  // ---------------------------------------------------------------
  // Financial infeasibility must not be hidden by a high score.
  // ---------------------------------------------------------------

  if (
    !schemeFeasible ||
    fundingGap > 0
  ) {

    if (
      score >= 50
    ) {

      return "proceed_with_caution";
    }

    return "not_recommended";
  }


  // ---------------------------------------------------------------
  // Missing repayment evidence.
  // ---------------------------------------------------------------

  if (
    capacity === "Unknown"
  ) {

    if (
      score >= 50
    ) {

      return "proceed_with_caution";
    }

    return "not_recommended";
  }


  // ---------------------------------------------------------------
  // Strong viability + strong repayment.
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
  // Moderate viability.
  // ---------------------------------------------------------------

  if (
    score >= 50
  ) {

    return "proceed_with_caution";
  }


  return "not_recommended";
}


module.exports = {
  generate,
  deriveRecommendation,
};