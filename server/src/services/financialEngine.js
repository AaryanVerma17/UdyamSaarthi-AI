/**
 * Module 5 — Financial Calculator
 *
 * PHASE 0:
 * - Keeps calculations deterministic.
 * - Removes the assumption that the global 10% rule is universally valid.
 * - Accepts a financing rule explicitly.
 * - Returns rule provenance so the report cannot silently present an
 *   assumption as an official scheme requirement.
 *
 * No LLM / ML is involved.
 */

const {
  OWN_CAPITAL_PERCENTAGE,
} = require("../../../shared/constants/schemeRules");

const {
  InvalidInputError,
} = require("../middlewares/errorHandler");

/**
 * Validate a financing rule before using it.
 */
function validateFinancingRule(financingRule) {
  if (!financingRule || typeof financingRule !== "object") {
    throw new InvalidInputError("financingRule is required");
  }

  const percentage = financingRule.ownCapitalPercentage;

  if (
    typeof percentage !== "number" ||
    Number.isNaN(percentage) ||
    percentage <= 0 ||
    percentage >= 100
  ) {
    throw new InvalidInputError(
      "financingRule.ownCapitalPercentage must be between 0 and 100"
    );
  }
}

/**
 * Calculate project cost and loan amount.
 *
 * @param {number} ownCapital
 * @param {object} financingRule
 *
 * @returns {{
 *   ownCapital:number,
 *   projectCost:number,
 *   loanAmount:number,
 *   ownCapitalPercentage:number,
 *   financingRuleStatus:string,
 *   financingRuleSource:object
 * }}
 */
function calculate(
  ownCapital,
  financingRule = {
    ownCapitalPercentage: OWN_CAPITAL_PERCENTAGE,
    ruleStatus: "provisional_assumption",
    ruleSource: {
      type: "development_assumption",
      authority: "not_verified",
      sourceUrl: null,
      version: "phase0-baseline-v1",
      effectiveFrom: null,
      verifiedAt: null,
    },
  }
) {
  if (
    typeof ownCapital !== "number" ||
    Number.isNaN(ownCapital) ||
    ownCapital <= 0
  ) {
    throw new InvalidInputError(
      "ownCapital must be a positive number"
    );
  }

  validateFinancingRule(financingRule);

  const marginFraction =
    financingRule.ownCapitalPercentage / 100;

  const projectCost =
    Math.round(
      (ownCapital / marginFraction) * 100
    ) / 100;

  const loanAmount =
    Math.round(
      projectCost * (1 - marginFraction) * 100
    ) / 100;

  return {
    ownCapital,
    projectCost,
    loanAmount,
    ownCapitalPercentage:
      financingRule.ownCapitalPercentage,
    financingRuleStatus:
      financingRule.ruleStatus || "unknown",
    financingRuleSource:
      financingRule.ruleSource || null,
  };
}

module.exports = {
  calculate,
  validateFinancingRule,
};