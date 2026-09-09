const {
  calculate,
  applySchemeLimit,
} = require(
  "../src/services/financialEngine"
);

describe(
  "financialEngine",
  () => {
    test(
      "calculates project cost from own capital",
      () => {
        const result =
          calculate(100000);

        expect(
          result.ownCapital
        ).toBe(100000);

        expect(
          result.projectCost
        ).toBe(1000000);

        expect(
          result.loanAmount
        ).toBe(900000);

        expect(
          result.theoreticalLoanAmount
        ).toBe(900000);
      }
    );

    test(
      "calculates theoretical loan",
      () => {
        const result =
          calculate(50000);

        expect(
          result.projectCost
        ).toBe(500000);

        expect(
          result.theoreticalLoanAmount
        ).toBe(450000);

        expect(
          result.loanAmount
        ).toBe(450000);
      }
    );

    test(
      "rejects zero capital",
      () => {
        expect(
          () =>
            calculate(0)
        ).toThrow();
      }
    );

    test(
      "rejects negative capital",
      () => {
        expect(
          () =>
            calculate(-1000)
        ).toThrow();
      }
    );

    test(
      "applies maximum loan limit",
      () => {
        const result =
          applySchemeLimit(
            calculate(5000000),
            {
              maxLoan: 4500000,
              maxProjectCost: 5000000,
            }
          );

        expect(
          result.loanAmount
        ).toBe(4500000);

        expect(
          result.theoreticalLoanAmount
        ).toBe(45000000);

        expect(
          result.fundingGap
        ).toBe(40500000);

        expect(
          result.schemeFeasible
        ).toBe(false);
      }
    );

    test(
      "keeps loan unchanged when below scheme limit",
      () => {
        const base =
          calculate(100000);

        const result =
          applySchemeLimit(
            base,
            {
              maxLoan: 4500000,
              maxProjectCost: 5000000,
            }
          );

        expect(
          result.loanAmount
        ).toBe(
          base.theoreticalLoanAmount
        );

        expect(
          result.fundingGap
        ).toBe(0);

        expect(
          result.schemeFeasible
        ).toBe(true);

        expect(
          result.financialFeasibility.status
        ).toBe(
          "within_scheme_limits"
        );
      }
    );

    test(
      "marks project cost above scheme limit as infeasible",
      () => {
        const base =
          calculate(600000);

        const result =
          applySchemeLimit(
            base,
            {
              maxLoan: 4500000,
              maxProjectCost: 5000000,
            }
          );

        expect(
          result.projectCost
        ).toBe(6000000);

        expect(
          result.schemeFeasible
        ).toBe(false);

        expect(
          result.financialFeasibility
            .projectCostWithinSchemeLimit
        ).toBe(false);
      }
    );
  }
);