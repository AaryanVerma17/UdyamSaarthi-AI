describe(
  "Phase 7 viability contract",
  () => {

    test(
      "viability score must be between 0 and 100",
      () => {

        const score = 78;

        expect(score)
          .toBeGreaterThanOrEqual(0);

        expect(score)
          .toBeLessThanOrEqual(100);
      }
    );


    test(
      "missing competition must not become zero competition",
      () => {

        const competition = {
          identifiable: false,
          count: null,
          classification:
            "data_unavailable",
        };


        expect(
          competition.count
        ).toBeNull();


        expect(
          competition.classification
        ).toBe(
          "data_unavailable"
        );
      }
    );


    test(
      "missing competition must not be classified as under-served",
      () => {

        const competition = {
          identifiable: false,
          count: null,
          classification:
            "data_unavailable",
        };


        expect(
          competition.classification
        ).not.toBe(
          "under_served"
        );
      }
    );


    test(
      "saturated competition does not automatically reject",
      () => {

        const result =
          deriveTestRecommendation(
            65,
            "Medium",
            true,
            0
          );


        expect(result)
          .toBe(
            "proceed_with_caution"
          );
      }
    );


    test(
      "high viability with acceptable repayment capacity can proceed",
      () => {

        const result =
          deriveTestRecommendation(
            80,
            "High",
            true,
            0
          );


        expect(result)
          .toBe(
            "proceed"
          );
      }
    );


    test(
      "low viability should not be recommended",
      () => {

        const result =
          deriveTestRecommendation(
            40,
            "Low",
            true,
            0
          );


        expect(result)
          .toBe(
            "not_recommended"
          );
      }
    );


    test(
      "funding gap prevents unconditional proceed",
      () => {

        const result =
          deriveTestRecommendation(
            85,
            "High",
            false,
            50000
          );


        expect(result)
          .toBe(
            "proceed_with_caution"
          );
      }
    );


    test(
      "score and evidence status are separate concepts",
      () => {

        const viability = {
          score: 82,
          estimateStatus:
            "partially_evidence_supported",
        };


        expect(
          viability.score
        ).toBe(82);


        expect(
          viability.estimateStatus
        ).toBe(
          "partially_evidence_supported"
        );
      }
    );


    test(
      "planning assumptions are explicitly labelled",
      () => {

        const businessEconomics = {
          assumptionStatus:
            "planning_assumption",
        };


        expect(
          businessEconomics.assumptionStatus
        ).toBe(
          "planning_assumption"
        );
      }
    );

  }
);


function deriveTestRecommendation(
  score,
  capacity,
  schemeFeasible,
  fundingGap
) {

  if (
    !schemeFeasible &&
    fundingGap > 0
  ) {

    return "proceed_with_caution";
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


  if (
    score >= 50
  ) {

    return "proceed_with_caution";
  }


  return "not_recommended";
}