const {
  route,
  isApplicable,
} = require(
  "../src/services/schemeRouter"
);

describe(
  "schemeRouter",
  () => {
    test(
      "routes small projects to micro finance",
      () => {
        const scheme =
          route(140000);

        expect(
          scheme.name
        ).toBe(
          "Micro Finance Scheme"
        );

        expect(
          scheme.interestRate
        ).toBe(6.5);

        expect(
          scheme.tenureYears
        ).toBe(3);

        expect(
          scheme.moratoriumMonths
        ).toBe(3);
      }
    );

    test(
      "routes larger projects to term loan",
      () => {
        const scheme =
          route(1000000);

        expect(
          scheme.name
        ).toBe(
          "Term Loan Scheme"
        );

        expect(
          scheme.interestRate
        ).toBe(8);

        expect(
          scheme.tenureYears
        ).toBe(7);

        expect(
          scheme.moratoriumMonths
        ).toBe(6);
      }
    );

    test(
      "rejects projects above configured limit",
      () => {
        expect(
          () =>
            route(5000001)
        ).toThrow();
      }
    );

    test(
      "boundary 140000 goes to micro finance",
      () => {
        expect(
          route(140000).code
        ).toBe(
          "MICRO_FINANCE"
        );
      }
    );

    test(
      "boundary 140001 goes to term loan",
      () => {
        expect(
          route(140001).code
        ).toBe(
          "TERM_LOAN"
        );
      }
    );

    test(
      "scheme is explicitly provisional",
      () => {
        const scheme =
          route(100000);

        expect(
          scheme.ruleStatus
        ).toBe(
          "provisional"
        );

        expect(
          scheme.verified
        ).toBe(false);

        expect(
          scheme.applicability
        ).toBe(
          "provisional"
        );
      }
    );

    test(
      "isApplicable identifies valid project ranges",
      () => {
        const scheme =
          route(100000);

        expect(
          isApplicable(
            100000,
            scheme
          )
        ).toBe(true);

        expect(
          isApplicable(
            500000,
            scheme
          )
        ).toBe(false);
      }
    );
  }
);