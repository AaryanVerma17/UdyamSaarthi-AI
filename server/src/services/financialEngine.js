/**
 * Module 5 — Financial Calculator (Deterministic)
 * NO LLM / NO ML involved. Pure, side-effect-free math, unit-tested against
 * the official scheme table in shared/constants/schemeRules.js.
 */
const { OWN_CAPITAL_PERCENTAGE } = require("../../../shared/constants/schemeRules");
const { InvalidInputError } = require("../middlewares/errorHandler");

/**
 * @param {number} ownCapital - Beneficiary's own available margin money (INR)
 * @returns {{ ownCapital: number, projectCost: number, loanAmount: number }}
 */
function calculate(ownCapital) {
  if (typeof ownCapital !== "number" || Number.isNaN(ownCapital) || ownCapital <= 0) {
    throw new InvalidInputError("ownCapital must be a positive number");
  }

  const marginFraction = OWN_CAPITAL_PERCENTAGE / 100; // 10% -> 0.10
  const projectCost = Math.round((ownCapital / marginFraction) * 100) / 100;
  const loanAmount = Math.round((projectCost * (1 - marginFraction)) * 100) / 100;

  return { ownCapital, projectCost, loanAmount };
}

module.exports = { calculate };
