/**
 * Module 6 — Deterministic Scheme Router
 *
 * Phase 6
 *
 * Scheme selection is NEVER performed by an LLM.
 *
 * This service selects the configured scheme based
 * solely on project cost.
 */

const {
  MICRO_FINANCE_SCHEME,
  TERM_LOAN_SCHEME,
} = require(
  "../../../shared/constants/schemeRules"
);

function assertValidProjectCost(projectCost) {
  const value = Number(projectCost);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      "projectCost must be a positive number"
    );
  }

  return value;
}

function cloneRule(rule) {
  return {
    ...rule,

    ruleStatus:
      rule.ruleStatus,

    verified:
      rule.ruleStatus === "verified",

    applicability:
      rule.ruleStatus === "verified"
        ? "verified"
        : "provisional",
  };
}

function route(projectCost) {
  const value =
    assertValidProjectCost(projectCost);

  /*
   * Micro Finance:
   * ₹0 — ₹1,40,000
   */
  if (
    value <=
    MICRO_FINANCE_SCHEME.maxProjectCost
  ) {
    return cloneRule(
      MICRO_FINANCE_SCHEME
    );
  }

  /*
   * Term Loan:
   * ₹1,40,001 — ₹50,00,000
   */
  if (
    value >=
      TERM_LOAN_SCHEME.minProjectCost &&
    value <=
      TERM_LOAN_SCHEME.maxProjectCost
  ) {
    return cloneRule(
      TERM_LOAN_SCHEME
    );
  }

  const error =
    new Error(
      "No configured government scheme covers this project cost"
    );

  error.code =
    "SCHEME_NOT_APPLICABLE";

  error.projectCost =
    value;

  error.maxConfiguredProjectCost =
    TERM_LOAN_SCHEME.maxProjectCost;

  throw error;
}

function isApplicable(
  projectCost,
  scheme
) {
  const value =
    assertValidProjectCost(projectCost);

  if (!scheme) {
    return false;
  }

  const min =
    Number.isFinite(
      Number(scheme.minProjectCost)
    )
      ? Number(scheme.minProjectCost)
      : 0;

  const max =
    Number.isFinite(
      Number(scheme.maxProjectCost)
    )
      ? Number(scheme.maxProjectCost)
      : Infinity;

  return (
    value >= min &&
    value <= max
  );
}

module.exports = {
  route,
  isApplicable,
};