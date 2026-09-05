const { classifyCompetitionCount } = require("../src/services/competitionClassifier");

describe("competitionClassifier — mirrors ml_service's Python thresholds exactly", () => {
  test("0-3 is under_served", () => {
    expect(classifyCompetitionCount(0)).toBe("under_served");
    expect(classifyCompetitionCount(3)).toBe("under_served");
  });
  test("4-7 is moderately_competitive", () => {
    expect(classifyCompetitionCount(4)).toBe("moderately_competitive");
    expect(classifyCompetitionCount(7)).toBe("moderately_competitive");
  });
  test("8+ is highly_saturated", () => {
    expect(classifyCompetitionCount(8)).toBe("highly_saturated");
    expect(classifyCompetitionCount(9)).toBe("highly_saturated");
  });
});
