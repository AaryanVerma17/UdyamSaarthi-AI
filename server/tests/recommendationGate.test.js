const { applyRecommendationGate } = require("../src/services/recommendationGate");

const SAMPLE_OPPORTUNITIES = {
  alternatives: [
    { business: "Food Processing", score: 67 },
    { business: "Tailoring", score: 51 },
    { business: "Repair Shop", score: 48 },
    { business: "Kirana", score: 40 },
  ],
};

describe("recommendationGate — saturation caps 'proceed'", () => {
  test("downgrades 'proceed' to 'proceed_with_caution' when highly saturated", () => {
    const result = applyRecommendationGate({
      rawRecommendation: "proceed",
      competitorClassification: "highly_saturated",
      opportunities: SAMPLE_OPPORTUNITIES,
    });
    expect(result.finalRecommendation).toBe("proceed_with_caution");
    expect(result.gated).toBe(true);
  });

  test("a high viability score alone can never produce 'proceed' in a saturated market", () => {
    // Simulates the exact scenario the spec calls out: viability is high
    // enough to have raised "proceed", but the gate must still cap it.
    const result = applyRecommendationGate({
      rawRecommendation: "proceed",
      competitorClassification: "highly_saturated",
      opportunities: SAMPLE_OPPORTUNITIES,
    });
    expect(result.finalRecommendation).not.toBe("proceed");
  });
});

describe("recommendationGate — never upgrades a more cautious recommendation", () => {
  test("leaves 'not_recommended' as-is even when saturated (does not upgrade to the ceiling)", () => {
    const result = applyRecommendationGate({
      rawRecommendation: "not_recommended",
      competitorClassification: "highly_saturated",
      opportunities: SAMPLE_OPPORTUNITIES,
    });
    expect(result.finalRecommendation).toBe("not_recommended");
    expect(result.gated).toBe(false); // nothing was capped — it was already below the ceiling
  });

  test("leaves 'proceed_with_caution' unchanged when saturated (already at the ceiling)", () => {
    const result = applyRecommendationGate({
      rawRecommendation: "proceed_with_caution",
      competitorClassification: "highly_saturated",
      opportunities: SAMPLE_OPPORTUNITIES,
    });
    expect(result.finalRecommendation).toBe("proceed_with_caution");
    expect(result.gated).toBe(false);
  });
});

describe("recommendationGate — non-saturated markets pass through untouched", () => {
  test.each(["proceed", "proceed_with_caution", "not_recommended"])(
    "%s is unaffected when classification is 'moderately_competitive'",
    (raw) => {
      const result = applyRecommendationGate({
        rawRecommendation: raw,
        competitorClassification: "moderately_competitive",
        opportunities: SAMPLE_OPPORTUNITIES,
      });
      expect(result.finalRecommendation).toBe(raw);
      expect(result.gated).toBe(false);
      expect(result.surfacedAlternatives).toBeNull();
    }
  );

  test("'under_served' also passes through untouched", () => {
    const result = applyRecommendationGate({
      rawRecommendation: "proceed",
      competitorClassification: "under_served",
      opportunities: SAMPLE_OPPORTUNITIES,
    });
    expect(result.finalRecommendation).toBe("proceed");
    expect(result.surfacedAlternatives).toBeNull();
  });
});

describe("recommendationGate — surfaced alternatives", () => {
  test("promotes up to 3 alternatives when the gate triggers", () => {
    const result = applyRecommendationGate({
      rawRecommendation: "proceed",
      competitorClassification: "highly_saturated",
      opportunities: SAMPLE_OPPORTUNITIES,
    });
    expect(result.surfacedAlternatives).toHaveLength(3);
    expect(result.surfacedAlternatives[0].business).toBe("Food Processing");
  });

  test("handles missing/empty opportunities gracefully", () => {
    const result = applyRecommendationGate({
      rawRecommendation: "proceed",
      competitorClassification: "highly_saturated",
      opportunities: null,
    });
    expect(result.surfacedAlternatives).toEqual([]);
  });

  test("surfacedAlternatives is null (not just empty) when the gate does not trigger", () => {
    const result = applyRecommendationGate({
      rawRecommendation: "proceed",
      competitorClassification: "under_served",
      opportunities: SAMPLE_OPPORTUNITIES,
    });
    expect(result.surfacedAlternatives).toBeNull();
  });
});

describe("recommendationGate — invalid input", () => {
  test("throws on an unrecognized rawRecommendation instead of silently misbehaving", () => {
    expect(() =>
      applyRecommendationGate({
        rawRecommendation: "definitely_proceed_trust_me",
        competitorClassification: "highly_saturated",
        opportunities: SAMPLE_OPPORTUNITIES,
      })
    ).toThrow(/unrecognized rawRecommendation/);
  });
});
