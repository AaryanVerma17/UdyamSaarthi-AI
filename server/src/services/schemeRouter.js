/**
 * Module 6 — Scheme Router (Rules Engine)
 * Deterministic, auditable, never AI-decided. Routes a computed Project Cost
 * to the correct MoSJE scheme tier.
 */
const {
  MICRO_FINANCE_SCHEME,
  TERM_LOAN_SCHEME,
} = require("../../../shared/constants/schemeRules");
const { InvalidInputError, SchemeNotApplicableError } = require("../middlewares/errorHandler");

/**
 * @param {number} projectCost
 * @returns {object} the matching scheme object (capped loan amount applied)
 */
function route(projectCost) {
  if (typeof projectCost !== "number" || Number.isNaN(projectCost) || projectCost <= 0) {
    throw new InvalidInputError("projectCost must be a positive number");
  }

  if (projectCost <= MICRO_FINANCE_SCHEME.maxProjectCost) {
    return { ...MICRO_FINANCE_SCHEME };
  }

  if (projectCost <= TERM_LOAN_SCHEME.maxProjectCost) {
    return { ...TERM_LOAN_SCHEME };
  }

  throw new SchemeNotApplicableError(
    `Project cost ₹${projectCost} exceeds the ₹50 lakh limit stated in the PS`
  );
}

module.exports = { route };
