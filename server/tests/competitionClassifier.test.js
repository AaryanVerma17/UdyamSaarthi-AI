const {
  classifyCompetitionCount,
} = require(
  "../src/services/competitionClassifier"
);


describe(
  "competitionClassifier",
  () => {

    test(
      "0 competitors is under-served",
      () => {

        expect(
          classifyCompetitionCount(0)
        ).toBe(
          "under_served"
        );
      }
    );


    test(
      "3 competitors is under-served",
      () => {

        expect(
          classifyCompetitionCount(3)
        ).toBe(
          "under_served"
        );
      }
    );


    test(
      "4 competitors is moderately competitive",
      () => {

        expect(
          classifyCompetitionCount(4)
        ).toBe(
          "moderately_competitive"
        );
      }
    );


    test(
      "7 competitors is moderately competitive",
      () => {

        expect(
          classifyCompetitionCount(7)
        ).toBe(
          "moderately_competitive"
        );
      }
    );


    test(
      "8 competitors is highly saturated",
      () => {

        expect(
          classifyCompetitionCount(8)
        ).toBe(
          "highly_saturated"
        );
      }
    );


    test(
      "large competitor count is highly saturated",
      () => {

        expect(
          classifyCompetitionCount(100)
        ).toBe(
          "highly_saturated"
        );
      }
    );


    test(
      "null does not mean zero competitors",
      () => {

        expect(
          classifyCompetitionCount(null)
        ).toBe(
          "data_unavailable"
        );
      }
    );


    test(
      "undefined does not mean zero competitors",
      () => {

        expect(
          classifyCompetitionCount(undefined)
        ).toBe(
          "data_unavailable"
        );
      }
    );


    test(
      "negative counts are unavailable",
      () => {

        expect(
          classifyCompetitionCount(-1)
        ).toBe(
          "data_unavailable"
        );
      }
    );


    test(
      "NaN is unavailable",
      () => {

        expect(
          classifyCompetitionCount(NaN)
        ).toBe(
          "data_unavailable"
        );
      }
    );


    test(
      "Infinity is unavailable",
      () => {

        expect(
          classifyCompetitionCount(Infinity)
        ).toBe(
          "data_unavailable"
        );
      }
    );


    test(
      "string counts are unavailable",
      () => {

        expect(
          classifyCompetitionCount("5")
        ).toBe(
          "data_unavailable"
        );
      }
    );


    test(
      "boolean counts are unavailable",
      () => {

        expect(
          classifyCompetitionCount(true)
        ).toBe(
          "data_unavailable"
        );
      }
    );

  }
);