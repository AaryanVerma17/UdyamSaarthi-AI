/**
 * Module 6 — Deterministic Scheme Router.
 *
 * Scheme selection is NEVER performed by an LLM.
 */

const {
  MICRO_FINANCE_SCHEME,
  TERM_LOAN_SCHEME,
} = require(
  "../../../shared/constants/schemeRules"
);

/**
 * Validate project cost.
 */
function assertValidProjectCost(projectCost) {
  const value = Number(projectCost);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      "projectCost must be a positive number"
    );
  }

  return value;
}

/**
 * Clone scheme rule while exposing its verification status.
 */
function cloneRule(rule) {
  return {
    ...rule,

    ruleStatus: rule.ruleStatus,

    verified:
      rule.ruleStatus === "verified",

    applicability:
      rule.ruleStatus === "verified"
        ? "verified"
        : "provisional",
  };
}

/**
 * Select applicable scheme based on project cost.
 */
function route(projectCost) {
  const value =
    assertValidProjectCost(projectCost);

  if (
    value <=
    MICRO_FINANCE_SCHEME.maxProjectCost
  ) {
    return cloneRule(
      MICRO_FINANCE_SCHEME
    );
  }

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

/**
 * Check whether a scheme covers a project cost.
 */
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