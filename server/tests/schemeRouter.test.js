const schemeRouter = require("../src/services/schemeRouter");

describe("Module 6 — Scheme Router", () => {
  test("routes to Micro Finance Scheme at/under ₹1.40 lakh", () => {
    const scheme = schemeRouter.route(140000);
    expect(scheme.name).toBe("Micro Finance Scheme");
    expect(scheme.interestRate).toBe(6.5);
  });

  test("routes to Term Loan Scheme between ₹1.40L and ₹50L", () => {
    const scheme = schemeRouter.route(1000000);
    expect(scheme.name).toBe("Term Loan Scheme");
    expect(scheme.interestRate).toBe(8.0);
    expect(scheme.tenureYears).toBe(7);
  });

  test("throws SchemeNotApplicableError above ₹50 lakh", () => {
    expect(() => schemeRouter.route(6000000)).toThrow();
  });

  test("throws on invalid input", () => {
    expect(() => schemeRouter.route(-1)).toThrow();
  });
});
