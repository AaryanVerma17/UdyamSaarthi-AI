const financialEngine =
  require("../src/services/financialEngine");

describe(
  "Module 5 — Financial Calculator",
  () => {
    test(
      "computes project cost and loan amount using the default provisional rule",
      () => {
        const result =
          financialEngine.calculate(
            100000
          );

        expect(
          result.projectCost
        ).toBe(1000000);

        expect(
          result.loanAmount
        ).toBe(900000);

        expect(
          result.ownCapitalPercentage
        ).toBe(10);

        expect(
          result.financingRuleStatus
        ).toBe(
          "provisional_assumption"
        );
      }
    );

    test(
      "supports an explicit financing rule",
      () => {
        const result =
          financialEngine.calculate(
            100000,
            {
              ownCapitalPercentage: 20,
              ruleStatus:
                "verified",
              ruleSource: {
                type:
                  "official_guideline",
                authority:
                  "government",
              },
            }
          );

        expect(
          result.projectCost
        ).toBe(500000);

        expect(
          result.loanAmount
        ).toBe(400000);

        expect(
          result.ownCapitalPercentage
        ).toBe(20);

        expect(
          result.financingRuleStatus
        ).toBe("verified");
      }
    );

    test(
      "throws on zero or negative capital",
      () => {
        expect(
          () =>
            financialEngine.calculate(
              0
            )
        ).toThrow();

        expect(
          () =>
            financialEngine.calculate(
              -500
            )
        ).toThrow();
      }
    );

    test(
      "throws on non-numeric capital",
      () => {
        expect(
          () =>
            financialEngine.calculate(
              "100000"
            )
        ).toThrow();
      }
    );

    test(
      "throws when financing percentage is invalid",
      () => {
        expect(
          () =>
            financialEngine.calculate(
              100000,
              {
                ownCapitalPercentage: 100,
              }
            )
        ).toThrow();

        expect(
          () =>
            financialEngine.calculate(
              100000,
              {
                ownCapitalPercentage: 0,
              }
            )
        ).toThrow();
      }
    );
  }
);