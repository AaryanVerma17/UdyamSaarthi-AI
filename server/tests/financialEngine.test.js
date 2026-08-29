const financialEngine = require("../src/services/financialEngine");

describe("Module 5 — Financial Calculator", () => {
  test("computes project cost and loan amount from own capital", () => {
    const result = financialEngine.calculate(100000);
    expect(result.projectCost).toBe(1000000);
    expect(result.loanAmount).toBe(900000);
  });

  test("throws on zero or negative capital", () => {
    expect(() => financialEngine.calculate(0)).toThrow();
    expect(() => financialEngine.calculate(-500)).toThrow();
  });

  test("throws on non-numeric input", () => {
    expect(() => financialEngine.calculate("100000")).toThrow();
  });
});
