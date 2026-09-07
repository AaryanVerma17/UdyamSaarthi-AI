const { confidenceFromAge, wrapMetric } = require("../src/services/dataConfidence");

function daysAgo(n) {
  return new Date(
    Date.now() - n * 24 * 60 * 60 * 1000
  ).toISOString();
}

describe("dataConfidence — confidenceFromAge", () => {
  test("data from 10 days ago is high confidence", () => {
    expect(confidenceFromAge(daysAgo(10))).toBe("high");
  });

  test("data from 89 days ago is still high confidence (boundary)", () => {
    expect(confidenceFromAge(daysAgo(89))).toBe("high");
  });

  test("data from exactly 90 days ago is medium confidence (boundary)", () => {
    expect(confidenceFromAge(daysAgo(90))).toBe("medium");
  });

  test("data from 179 days ago is still medium confidence (boundary)", () => {
    expect(confidenceFromAge(daysAgo(179))).toBe("medium");
  });

  test("data from exactly 180 days ago is low confidence (boundary)", () => {
    expect(confidenceFromAge(daysAgo(180))).toBe("low");
  });

  test("data from 400 days ago is low confidence", () => {
    expect(confidenceFromAge(daysAgo(400))).toBe("low");
  });

  test("missing lastUpdated is low confidence, not a crash", () => {
    expect(confidenceFromAge(null)).toBe("low");
    expect(confidenceFromAge(undefined)).toBe("low");
  });

  test("garbage date string is low confidence, not a crash", () => {
    expect(confidenceFromAge("not-a-date")).toBe("low");
  });

  test("a future date is treated as low confidence, not 'high'", () => {
    const tomorrow = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    expect(confidenceFromAge(tomorrow)).toBe("low");
  });
});

describe("dataConfidence — wrapMetric", () => {
  test("wraps a fresh online value as high confidence, unverified", () => {
    // Capture the timestamp once so the expected value
    // is exactly the same timestamp passed to wrapMetric().
    const lastUpdated = daysAgo(5);

    const wrapped = wrapMetric(9200, {
      source: "OSM scrape",
      lastUpdated,
    });

    expect(wrapped).toEqual({
      value: 9200,
      min: null,
      max: null,
      source: "OSM scrape",
      lastUpdated,
      confidence: "high",
      verified: false,
    });
  });

  test("verified is always high confidence regardless of age", () => {
    const wrapped = wrapMetric(9, {
      source: "CA officer field visit",
      lastUpdated: daysAgo(200),
      verified: true,
    });

    expect(wrapped.confidence).toBe("high");
    expect(wrapped.verified).toBe(true);
  });

  test("supports a min/max range for values like pricing", () => {
    const wrapped = wrapMetric(38, {
      min: 30,
      max: 45,
      source: "mandi price sheet",
      lastUpdated: daysAgo(20),
    });

    expect(wrapped.min).toBe(30);
    expect(wrapped.max).toBe(45);
  });

  test("defaults gracefully when no meta is provided", () => {
    const wrapped = wrapMetric(100);

    expect(wrapped.source).toBe("unknown");
    expect(wrapped.confidence).toBe("low");
    expect(wrapped.verified).toBe(false);
  });
});