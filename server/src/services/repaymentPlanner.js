/**
 * Module 7 — Repayment Planner
 *
 * PHASE 0:
 * - Deterministic calculation.
 * - Never assumes that missing cash-flow evidence means zero cash flow.
 * - Repayment capacity becomes "Unknown" when reliable business cash-flow
 *   evidence is unavailable.
 */

const {
  InvalidInputError,
} = require("../middlewares/errorHandler");


function build(
  loanAmount,
  scheme,
  expectedMonthlyCashFlow
) {
  if (
    typeof loanAmount !== "number" ||
    Number.isNaN(loanAmount) ||
    loanAmount <= 0
  ) {
    throw new InvalidInputError(
      "loanAmount must be a positive number"
    );
  }

  if (
    !scheme ||
    typeof scheme.interestRate !== "number" ||
    typeof scheme.tenureYears !== "number"
  ) {
    throw new InvalidInputError(
      "scheme must include interestRate and tenureYears"
    );
  }

  const quarterlyRate =
    scheme.interestRate / 100 / 4;

  const moratoriumQuarters =
    Math.ceil(
      (scheme.moratoriumMonths || 0) / 3
    );

  const totalQuarters =
    scheme.tenureYears * 4;

  const repaymentQuarters =
    totalQuarters -
    moratoriumQuarters;

  if (repaymentQuarters <= 0) {
    throw new InvalidInputError(
      "scheme tenure must exceed the moratorium period"
    );
  }

  let principalAfterMoratorium;

  if (quarterlyRate === 0) {
    principalAfterMoratorium =
      loanAmount;
  } else {
    principalAfterMoratorium =
      loanAmount *
      Math.pow(
        1 + quarterlyRate,
        moratoriumQuarters
      );
  }

  let quarterlyInstallment;

  if (quarterlyRate === 0) {
    quarterlyInstallment =
      principalAfterMoratorium /
      repaymentQuarters;
  } else {
    const factor =
      Math.pow(
        1 + quarterlyRate,
        repaymentQuarters
      );

    quarterlyInstallment =
      (
        principalAfterMoratorium *
        quarterlyRate *
        factor
      ) /
      (factor - 1);
  }

  const totalRepaid =
    quarterlyInstallment *
    repaymentQuarters;

  const totalInterestPayable =
    totalRepaid -
    loanAmount;

  const moratoriumEndDate =
    new Date();

  moratoriumEndDate.setMonth(
    moratoriumEndDate.getMonth() +
    (scheme.moratoriumMonths || 0)
  );

  const repaymentSchedule = [];

  let balance =
    principalAfterMoratorium;

  const dueDate =
    new Date(
      moratoriumEndDate
    );

  for (
    let period = 1;
    period <= repaymentQuarters;
    period += 1
  ) {
    const interest =
      balance *
      quarterlyRate;

    const principal =
      quarterlyInstallment -
      interest;

    balance =
      Math.max(
        0,
        balance -
        principal
      );

    dueDate.setMonth(
      dueDate.getMonth() + 3
    );

    repaymentSchedule.push({
      period,
      principal:
        Math.round(
          principal * 100
        ) / 100,
      interest:
        Math.round(
          interest * 100
        ) / 100,
      dueDate:
        dueDate
          .toISOString()
          .slice(0, 10),
    });
  }

  const monthlyInstallmentEquivalent =
    quarterlyInstallment / 3;

  const repaymentCapacity =
    classifyCapacity(
      expectedMonthlyCashFlow,
      monthlyInstallmentEquivalent
    );

  return {
    quarterlyInstallment:
      Math.round(
        quarterlyInstallment * 100
      ) / 100,

    totalInterestPayable:
      Math.round(
        totalInterestPayable * 100
      ) / 100,

    moratoriumEndDate:
      moratoriumEndDate
        .toISOString()
        .slice(0, 10),

    repaymentCapacity,

    cashFlowEvidenceAvailable:
      typeof expectedMonthlyCashFlow ===
      "number" &&
      Number.isFinite(
        expectedMonthlyCashFlow
      ),

    repaymentSchedule,
  };
}


function classifyCapacity(
  expectedMonthlyCashFlow,
  monthlyInstallmentEquivalent
) {
  /*
   * Missing cash-flow data is UNKNOWN.
   *
   * It is NOT equivalent to zero.
   */

  if (
    typeof expectedMonthlyCashFlow !==
      "number" ||
    !Number.isFinite(
      expectedMonthlyCashFlow
    ) ||
    monthlyInstallmentEquivalent <= 0
  ) {
    return "Unknown";
  }

  const ratio =
    expectedMonthlyCashFlow /
    monthlyInstallmentEquivalent;

  if (ratio >= 2.0) {
    return "High";
  }

  if (ratio >= 1.2) {
    return "Medium";
  }

  return "Low";
}


module.exports = {
  build,
  classifyCapacity,
};