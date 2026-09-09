const {
  allocate,
  TEMPLATES,
  DEFAULT_TEMPLATE,
} = require(
  "../src/services/workingCapitalPlanner"
);

describe(
  "workingCapitalPlanner",
  () => {
    test(
      "allocates Dairy project cost",
      () => {
        const result =
          allocate(
            100000,
            "Dairy"
          );

        expect(
          result.equipment
        ).toBe(40000);

        expect(
          result.infrastructure
        ).toBe(20000);

        expect(
          result.initialInventory
        ).toBe(15000);

        expect(
          result.workingCapital
        ).toBe(15000);

        expect(
          result.marketing
        ).toBe(5000);

        expect(
          result.reserve
        ).toBe(5000);

        expect(
          result.total
        ).toBe(100000);
      }
    );

    test(
      "uses business-specific Kirana template",
      () => {
        const result =
          allocate(
            100000,
            "Kirana"
          );

        expect(
          result.initialInventory
        ).toBe(40000);

        expect(
          result.templateUsed
        ).toBe(
          "Kirana"
        );

        expect(
          result.usedDefaultTemplate
        ).toBe(false);
      }
    );

    test(
      "uses default template for unknown category",
      () => {
        const result =
          allocate(
            100000,
            "Unknown Business"
          );

        expect(
          result.templateUsed
        ).toBe(
          "DEFAULT"
        );

        expect(
          result.usedDefaultTemplate
        ).toBe(true);

        expect(
          result.total
        ).toBe(100000);
      }
    );

    test(
      "allocation percentages total 100 percent",
      () => {
        Object.values(
          TEMPLATES
        ).forEach(
          (template) => {
            const total =
              Object.values(
                template
              ).reduce(
                (sum, value) =>
                  sum + value,
                0
              );

            expect(
              total
            ).toBeCloseTo(
              1,
              6
            );
          }
        );
      }
    );

    test(
      "default template totals 100 percent",
      () => {
        const total =
          Object.values(
            DEFAULT_TEMPLATE
          ).reduce(
            (sum, value) =>
              sum + value,
            0
          );

        expect(
          total
        ).toBeCloseTo(
          1,
          6
        );
      }
    );

    test(
      "marks allocation as planning assumption",
      () => {
        const result =
          allocate(
            500000,
            "Dairy"
          );

        expect(
          result.planningBasis
        ).toBe(
          "Internal planning estimate"
        );

        expect(
          result.assumptionStatus
        ).toBe(
          "assumption"
        );

        expect(
          result.governmentRule
        ).toBe(false);

        expect(
          result.deterministic
        ).toBe(true);
      }
    );

    test(
      "provides transparent warning",
      () => {
        const result =
          allocate(
            500000,
            "Dairy"
          );

        expect(
          result.warning
        ).toContain(
          "not a government-prescribed"
        );

        expect(
          result.displayLabel
        ).toBe(
          "Illustrative project allocation based on the selected business category."
        );
      }
    );

    test(
      "rejects zero project cost",
      () => {
        expect(
          () =>
            allocate(
              0,
              "Dairy"
            )
        ).toThrow();
      }
    );

    test(
      "rejects negative project cost",
      () => {
        expect(
          () =>
            allocate(
              -1000,
              "Dairy"
            )
        ).toThrow();
      }
    );
  }
);