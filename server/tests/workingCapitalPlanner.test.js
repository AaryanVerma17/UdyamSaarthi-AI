const workingCapitalPlanner = require("../src/services/workingCapitalPlanner");

describe("Module 8 — Working Capital Planner", () => {
  test("allocates using the Dairy template", () => {
    const allocation = workingCapitalPlanner.allocate(1000000, "Dairy");
    expect(allocation.equipment).toBe(400000);
    expect(allocation.usedDefaultTemplate).toBe(false);
  });

  test("falls back to default template for unknown business categories", () => {
    const allocation = workingCapitalPlanner.allocate(1000000, "Alpaca Farming");
    expect(allocation.usedDefaultTemplate).toBe(true);
  });

  test("allocations sum to (approximately) the project cost", () => {
    const allocation = workingCapitalPlanner.allocate(1000000, "Dairy");
    const { usedDefaultTemplate, ...heads } = allocation;
    const sum = Object.values(heads).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1000000, 0);
  });
});
