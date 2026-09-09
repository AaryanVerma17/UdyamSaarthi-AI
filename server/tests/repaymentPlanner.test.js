const {
  build,
  calculatePeriodicPayment,
} = require(
  "../src/services/repaymentPlanner"
);


describe(
  "repaymentPlanner",
  () => {

    const scheme = {
      interestRate: 8,
      tenureYears: 7,
      moratoriumMonths: 6,
    };


    test(
      "calculates a quarterly periodic payment",
      () => {

        const payment =
          calculatePeriodicPayment(
            100000,
            8,
            4,
            28
          );


        expect(
          payment
        ).toBeGreaterThan(0);
      }
    );


    test(
      "creates quarterly repayment schedule",
      () => {

        const result =
          build(
            100000,
            scheme,
            60000,
            {
              startDate:
                "2026-01-01T00:00:00.000Z",
            }
          );


        expect(
          result.quarterlyInstallment
        ).toBeGreaterThan(0);


        expect(
          result.repaymentSchedule.length
        ).toBe(28);


        expect(
          result.repaymentSchedule[0]
            .payment
        ).toBeGreaterThan(0);
      }
    );


    test(
      "applies moratorium before first repayment",
      () => {

        const result =
          build(
            100000,
            scheme,
            60000,
            {
              startDate:
                "2026-01-01T00:00:00.000Z",
            }
          );


        expect(
          result.moratoriumMonths
        ).toBe(6);


        expect(
          result.moratoriumEndDate
        ).toBe("2026-07-01");


        expect(
          result.repaymentSchedule[0]
            .dueDate
        ).toBe("2026-10-01");
      }
    );


    test(
      "compares quarterly cash flow with quarterly repayment",
      () => {

        const result =
          build(
            100000,
            scheme,
            60000,
            {
              startDate:
                "2026-01-01T00:00:00.000Z",
            }
          );


        expect(
          result.monthlyExpectedCashFlow
        ).toBe(60000);


        expect(
          result.quarterlyExpectedCashFlow
        ).toBe(180000);


        expect(
          result.repaymentCoverageRatio
        ).toBeGreaterThan(0);


        expect([
          "High",
          "Medium",
          "Low",
        ]).toContain(
          result.repaymentCapacity
        );
      }
    );


    test(
      "high cash flow produces high repayment capacity",
      () => {

        const result =
          build(
            100000,
            scheme,
            100000,
            {
              startDate:
                "2026-01-01T00:00:00.000Z",
            }
          );


        expect(
          result.repaymentCapacity
        ).toBe("High");
      }
    );


    test(
      "low cash flow produces low repayment capacity",
      () => {

        const result =
          build(
            100000,
            scheme,
            1,
            {
              startDate:
                "2026-01-01T00:00:00.000Z",
            }
          );


        expect(
          result.repaymentCapacity
        ).toBe("Low");
      }
    );


    test(
      "missing cash flow remains unknown",
      () => {

        const result =
          build(
            100000,
            scheme,
            null,
            {
              startDate:
                "2026-01-01T00:00:00.000Z",
            }
          );


        expect(
          result.monthlyExpectedCashFlow
        ).toBeNull();


        expect(
          result.quarterlyExpectedCashFlow
        ).toBeNull();


        expect(
          result.repaymentCoverageRatio
        ).toBeNull();


        expect(
          result.repaymentCapacity
        ).toBe("Unknown");
      }
    );


    test(
      "zero interest is handled correctly",
      () => {

        const zeroInterestScheme = {
          interestRate: 0,
          tenureYears: 2,
          moratoriumMonths: 0,
        };


        const result =
          build(
            120000,
            zeroInterestScheme,
            20000,
            {
              startDate:
                "2026-01-01T00:00:00.000Z",
            }
          );


        expect(
          result.quarterlyInstallment
        ).toBe(15000);


        expect(
          result.totalInterestPayable
        ).toBe(0);
      }
    );


    test(
      "repayment schedule closes the loan",
      () => {

        const result =
          build(
            100000,
            scheme,
            60000,
            {
              startDate:
                "2026-01-01T00:00:00.000Z",
            }
          );


        const last =
          result.repaymentSchedule[
            result.repaymentSchedule.length - 1
          ];


        expect(
          last.closingBalance
        ).toBeLessThanOrEqual(0.01);
      }
    );


    test(
      "invalid loan amount is rejected",
      () => {

        expect(
          () =>
            build(
              -100,
              scheme,
              50000
            )
        ).toThrow();
      }
    );


    test(
      "invalid scheme is rejected",
      () => {

        expect(
          () =>
            build(
              100000,
              null,
              50000
            )
        ).toThrow(
          "scheme is required"
        );
      }
    );

  }
);