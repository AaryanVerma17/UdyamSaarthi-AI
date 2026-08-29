/**
 * Module 7 — Repayment Planner (Deterministic)
 * Computes quarterly EMI, total interest, moratorium end date, and a simple
 * repayment-capacity classification against expected business cash flow.
 */
const { InvalidInputError } = require("../middlewares/errorHandler");

/**
 * Standard amortization formula, applied quarterly, after the moratorium period.
 * Moratorium-period interest is capitalized into the principal (simple, explicit
 * convention — document this choice for your team, per the earlier review note).
 */
function build(loanAmount, scheme, expectedMonthlyCashFlow) {
  if (typeof loanAmount !== "number" || loanAmount <= 0) {
    throw new InvalidInputError("loanAmount must be a positive number");
  }
  if (!scheme || typeof scheme.interestRate !== "number" || typeof scheme.tenureYears !== "number") {
    throw new InvalidInputError("scheme must include interestRate and tenureYears");
  }

  const quarterlyRate = scheme.interestRate / 100 / 4;
  const moratoriumQuarters = Math.ceil((scheme.moratoriumMonths || 0) / 3);
  const totalQuarters = scheme.tenureYears * 4;
  const repaymentQuarters = totalQuarters - moratoriumQuarters;

  // Capitalize interest accrued during the moratorium into the principal
  const principalAfterMoratorium =
    loanAmount * Math.pow(1 + quarterlyRate, moratoriumQuarters);

  // Standard EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
  const factor = Math.pow(1 + quarterlyRate, repaymentQuarters);
  const quarterlyInstallment =
    (principalAfterMoratorium * quarterlyRate * factor) / (factor - 1);

  const totalRepaid = quarterlyInstallment * repaymentQuarters;
  const totalInterestPayable = totalRepaid - loanAmount;

  const moratoriumEndDate = new Date();
  moratoriumEndDate.setMonth(moratoriumEndDate.getMonth() + (scheme.moratoriumMonths || 0));

  const repaymentSchedule = [];
  let balance = principalAfterMoratorium;
  const dueDate = new Date(moratoriumEndDate);
  for (let period = 1; period <= repaymentQuarters; period += 1) {
    const interest = balance * quarterlyRate;
    const principal = quarterlyInstallment - interest;
    balance -= principal;
    dueDate.setMonth(dueDate.getMonth() + 3);
    repaymentSchedule.push({
      period,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      dueDate: new Date(dueDate).toISOString().slice(0, 10),
    });
  }

  const repaymentCapacity = classifyCapacity(
    expectedMonthlyCashFlow,
    quarterlyInstallment / 3 // approximate monthly equivalent
  );

  return {
    quarterlyInstallment: Math.round(quarterlyInstallment * 100) / 100,
    totalInterestPayable: Math.round(totalInterestPayable * 100) / 100,
    moratoriumEndDate: moratoriumEndDate.toISOString().slice(0, 10),
    repaymentCapacity,
    repaymentSchedule,
  };
}

function classifyCapacity(expectedMonthlyCashFlow, monthlyInstallmentEquivalent) {
  if (!expectedMonthlyCashFlow || monthlyInstallmentEquivalent <= 0) return "Unknown";
  const ratio = expectedMonthlyCashFlow / monthlyInstallmentEquivalent;
  if (ratio >= 2.0) return "High";
  if (ratio >= 1.2) return "Medium";
  return "Low";
}

module.exports = { build, classifyCapacity };
