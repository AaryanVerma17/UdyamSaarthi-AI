/**
 * Module 5 — Deterministic Financial Engine
 *
 * Phase 6
 *
 * No ML.
 * No LLM.
 * No external API.
 *
 * Responsibilities:
 * 1. Calculate theoretical project cost from own capital.
 * 2. Calculate theoretical financing requirement.
 * 3. Apply scheme-specific loan limits.
 * 4. Calculate funding gap.
 *
 * Important:
 * The financial engine does NOT choose a government scheme.
 * Scheme selection belongs to schemeRouter.js.
 */

const DEFAULT_OWN_CAPITAL_PERCENTAGE = 10;
const DEFAULT_FINANCING_PERCENTAGE = 90;

/**
 * Validate positive monetary input.
 */
function assertPositiveMoney(value, fieldName) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }

  return numeric;
}

/**
 * Round monetary values to two decimal places.
 */
function roundMoney(value) {
  return (
    Math.round((Number(value) + Number.EPSILON) * 100) / 100
  );
}

/**
 * Calculate theoretical financing structure.
 *
 * Example:
 *
 * Own capital = ₹50,000
 * Own contribution = 10%
 *
 * Theoretical project cost = ₹5,00,000
 * Theoretical loan = ₹4,50,000
 *
 * Scheme limits are NOT applied here.
 */
function calculate(ownCapital, options = {}) {
  const capital = assertPositiveMoney(
    ownCapital,
    "ownCapital"
  );

  const ownCapitalPercentage =
    Number.isFinite(
      Number(options.ownCapitalPercentage)
    )
      ? Number(options.ownCapitalPercentage)
      : DEFAULT_OWN_CAPITAL_PERCENTAGE;

  const financingPercentage =
    Number.isFinite(
      Number(options.financingPercentage)
    )
      ? Number(options.financingPercentage)
      : DEFAULT_FINANCING_PERCENTAGE;

  if (
    ownCapitalPercentage <= 0 ||
    ownCapitalPercentage > 100
  ) {
    throw new Error(
      "ownCapitalPercentage must be between 0 and 100"
    );
  }

  if (
    financingPercentage < 0 ||
    financingPercentage > 100
  ) {
    throw new Error(
      "financingPercentage must be between 0 and 100"
    );
  }

  const projectCost =
    capital /
    (ownCapitalPercentage / 100);

  const theoreticalLoan =
    projectCost *
    (financingPercentage / 100);

  return {
    ownCapital: roundMoney(capital),

    ownCapitalPercentage,

    financingPercentage,

    projectCost:
      roundMoney(projectCost),

    theoreticalLoanAmount:
      roundMoney(theoreticalLoan),

    /*
     * Before scheme limits are applied,
     * loanAmount equals the theoretical amount.
     */
    loanAmount:
      roundMoney(theoreticalLoan),

    fundingGap: 0,

    schemeFeasible: true,

    calculationMethod:
      "Own capital / own capital percentage",

    deterministic: true,

    ruleStatus:
      "derived_from_financial_formula",
  };
}

/**
 * Apply a selected scheme's maximum loan/project-cost limits.
 *
 * This function does NOT select the scheme.
 *
 * It takes:
 *   financials = output of calculate()
 *   scheme     = output of schemeRouter.route()
 *
 * Example:
 *
 * Theoretical loan = ₹50,00,000
 * Scheme max loan = ₹45,00,000
 *
 * Actual scheme-supported loan = ₹45,00,000
 * Funding gap = ₹5,00,000
 */
function applySchemeLimit(financials, scheme) {
  if (!financials || !scheme) {
    throw new Error(
      "financials and scheme are required"
    );
  }

  /*
   * Read and validate the project cost.
   */
  const projectCost =
    Number(financials.projectCost);

  /*
   * Prefer theoreticalLoanAmount.
   *
   * loanAmount is used as a fallback so that
   * the function remains compatible with older
   * financial objects.
   */
  const theoreticalLoan =
    Number(
      financials.theoreticalLoanAmount ??
      financials.loanAmount
    );

  if (
    !Number.isFinite(projectCost) ||
    !Number.isFinite(theoreticalLoan)
  ) {
    throw new Error(
      "Invalid financial values"
    );
  }

  /*
   * Convert scheme limits to numbers.
   *
   * If a scheme does not define a limit,
   * Number(undefined) becomes NaN and the
   * corresponding limit is treated as unlimited.
   */
  const maxLoan =
    Number(scheme.maxLoan);

  const maxProjectCost =
    Number(scheme.maxProjectCost);

  /*
   * Apply maximum loan limit.
   *
   * The actual loan cannot exceed the
   * scheme's maximum permitted loan.
   */
  const loanAmount =
    Number.isFinite(maxLoan)
      ? Math.min(
          theoreticalLoan,
          maxLoan
        )
      : theoreticalLoan;

  /*
   * Check whether the total project cost
   * falls within the scheme's project-cost
   * eligibility limit.
   */
  const projectCostWithinSchemeLimit =
    !Number.isFinite(maxProjectCost) ||
    projectCost <= maxProjectCost;

  /*
   * Funding gap is the portion of the
   * theoretical financing requirement that
   * cannot be covered by the scheme loan.
   */
  const fundingGap =
    Math.max(
      0,
      theoreticalLoan -
      loanAmount
    );

  /*
   * The scheme is fully feasible only when:
   *
   * 1. Project cost is within scheme limit.
   * 2. There is no funding gap.
   */
  const schemeFeasible =
    projectCostWithinSchemeLimit &&
    fundingGap === 0;

  return {
    ...financials,

    /*
     * Scheme-adjusted loan amount.
     */
    loanAmount:
      roundMoney(loanAmount),

    /*
     * Amount still requiring additional
     * funding beyond the scheme loan.
     */
    fundingGap:
      roundMoney(fundingGap),

    schemeFeasible,

    /*
     * True when the theoretical loan was
     * reduced because of the scheme limit.
     */
    schemeLimitApplied:
      loanAmount < theoreticalLoan,

    /*
     * Expose scheme limits for downstream
     * reporting and explainability.
     */
    maxLoan:
      Number.isFinite(maxLoan)
        ? maxLoan
        : null,

    maxProjectCost:
      Number.isFinite(maxProjectCost)
        ? maxProjectCost
        : null,

    /*
     * Detailed financial feasibility result.
     *
     * This is intentionally separate from
     * schemeFeasible so the frontend/report
     * can explain WHY a project is or isn't
     * feasible.
     */
    financialFeasibility: {
      projectCostWithinSchemeLimit,

      loanWithinSchemeLimit:
        Number.isFinite(maxLoan)
          ? loanAmount <= maxLoan
          : true,

      fundingGap:
        roundMoney(fundingGap),

      status:
        schemeFeasible
          ? "within_scheme_limits"
          : "additional_funding_required",
    },
  };
}

module.exports = {
  calculate,
  applySchemeLimit,
  roundMoney,
};