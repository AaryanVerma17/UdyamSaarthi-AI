const {
  confidenceFromAge,
  wrapMetric,
  confidenceNote,
  stepDownConfidence,
} = require("../src/services/dataConfidence");

const FIXED_NOW =
  new Date(
    "2026-09-05T16:20:20.000Z"
  );

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(
    FIXED_NOW
  );
});

afterAll(() => {
  jest.useRealTimers();
});

function daysAgo(n) {
  return new Date(
    Date.now() -
      n *
        24 *
        60 *
        60 *
        1000
  ).toISOString();
}


describe(
  "dataConfidence — confidenceFromAge",
  () => {
    test(
      "10 days ago is high confidence",
      () => {
        expect(
          confidenceFromAge(
            daysAgo(10)
          )
        ).toBe("high");
      }
    );

    test(
      "89 days ago is high confidence",
      () => {
        expect(
          confidenceFromAge(
            daysAgo(89)
          )
        ).toBe("high");
      }
    );

    test(
      "exactly 90 days is medium confidence",
      () => {
        expect(
          confidenceFromAge(
            daysAgo(90)
          )
        ).toBe("medium");
      }
    );

    test(
      "179 days is medium confidence",
      () => {
        expect(
          confidenceFromAge(
            daysAgo(179)
          )
        ).toBe("medium");
      }
    );

    test(
      "exactly 180 days is low confidence",
      () => {
        expect(
          confidenceFromAge(
            daysAgo(180)
          )
        ).toBe("low");
      }
    );

    test(
      "missing date is low confidence",
      () => {
        expect(
          confidenceFromAge(null)
        ).toBe("low");

        expect(
          confidenceFromAge(
            undefined
          )
        ).toBe("low");
      }
    );

    test(
      "future date is low confidence",
      () => {
        const tomorrow =
          new Date(
            Date.now() +
              24 *
                60 *
                60 *
                1000
          ).toISOString();

        expect(
          confidenceFromAge(
            tomorrow
          )
        ).toBe("low");
      }
    );
  }
);


describe(
  "dataConfidence — wrapMetric",
  () => {
    test(
      "wraps metric with provenance",
      () => {
        const lastUpdated =
          daysAgo(5);

        const wrapped =
          wrapMetric(
            9200,
            {
              source:
                "OSM scrape",
              sourceType:
                "secondary",
              authority:
                "non-government",
              coverage:
                "local",
              geographicPrecision:
                "village",
              completeness:
                "partial",
              lastUpdated,
            }
          );

        expect(
          wrapped.value
        ).toBe(9200);

        expect(
          wrapped.source
        ).toBe("OSM scrape");

        expect(
          wrapped.sourceType
        ).toBe("secondary");

        expect(
          wrapped.authority
        ).toBe(
          "non-government"
        );

        expect(
          wrapped.confidence
        ).toBe("high");

        expect(
          wrapped.estimated
        ).toBe(false);
      }
    );

    test(
      "verified metric is high confidence",
      () => {
        const wrapped =
          wrapMetric(
            9,
            {
              source:
                "field verification",
              lastUpdated:
                daysAgo(200),
              verified:
                true,
            }
          );

        expect(
          wrapped.confidence
        ).toBe("high");

        expect(
          wrapped.verified
        ).toBe(true);
      }
    );

    test(
      "supports ranges",
      () => {
        const wrapped =
          wrapMetric(
            38,
            {
              min: 30,
              max: 45,
            }
          );

        expect(
          wrapped.min
        ).toBe(30);

        expect(
          wrapped.max
        ).toBe(45);
      }
    );

    test(
      "supports estimated values",
      () => {
        const wrapped =
          wrapMetric(
            100,
            {
              estimated: true,
              note:
                "Development fallback",
            }
          );

        expect(
          wrapped.estimated
        ).toBe(true);

        expect(
          confidenceNote(
            wrapped
          )
        ).toMatch(
          /estimate/i
        );
      }
    );

    test(
      "steps confidence down safely",
      () => {
        expect(
          stepDownConfidence(
            "high"
          )
        ).toBe("medium");

        expect(
          stepDownConfidence(
            "medium"
          )
        ).toBe("low");

        expect(
          stepDownConfidence(
            "low"
          )
        ).toBe("low");
      }
    );
  }
);