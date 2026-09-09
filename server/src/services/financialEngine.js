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

function assertPositiveMoney(value, fieldName) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }

  return numeric;
}

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

    projectCost: roundMoney(projectCost),

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

  const projectCost =
    Number(financials.projectCost);

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

  const maxLoan =
    Number(scheme.maxLoan);

  const maxProjectCost =
    Number(scheme.maxProjectCost);

  const loanAmount =
    Number.isFinite(maxLoan)
      ? Math.min(
          theoreticalLoan,
          maxLoan
        )
      : theoreticalLoan;

  const projectCostWithinLimit =
    !Number.isFinite(maxProjectCost) ||
    projectCost <= maxProjectCost;

  const fundingGap =
    Math.max(
      0,
      theoreticalLoan - loanAmount
    );

  const schemeFeasible =
    projectCostWithinLimit &&
    fundingGap === 0;

  return {
    ...financials,

    loanAmount:
      roundMoney(loanAmount),

    fundingGap:
      roundMoney(fundingGap),

    schemeFeasible,

    schemeLimitApplied:
      loanAmount < theoreticalLoan,

    maxLoan:
      Number.isFinite(maxLoan)
        ? maxLoan
        : null,

    maxProjectCost:
      Number.isFinite(maxProjectCost)
        ? maxProjectCost
        : null,

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