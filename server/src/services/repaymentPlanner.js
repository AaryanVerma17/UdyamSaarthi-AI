/**
 * UdyamSaarthi-AI
 * Module 7 — Deterministic Repayment Planner
 *
 * Purpose:
 * - Calculate quarterly loan repayment
 * - Apply moratorium
 * - Generate amortisation schedule
 * - Compare quarterly repayment with quarterly expected cash flow
 * - Classify repayment capacity
 *
 * IMPORTANT:
 * - No ML
 * - No LLM
 * - No external API
 * - All calculations are deterministic
 *
 * Repayment capacity:
 *   >= 1.50  → High
 *   >= 1.10  → Medium
 *   <  1.10  → Low
 *
 * Missing cash flow:
 *   → Unknown
 *
 * The system must NEVER convert missing cash flow to zero.
 */


/**
 * Validate a non-negative numeric value.
 */
function assertNonNegative(value, fieldName) {
  const numeric = Number(value);

  if (
    !Number.isFinite(numeric) ||
    numeric < 0
  ) {
    throw new Error(
      `${fieldName} must be a valid non-negative number`
    );
  }

  return numeric;
}


/**
 * Round currency values to two decimals.
 */
function roundMoney(value) {
  return (
    Math.round(
      (Number(value) + Number.EPSILON) * 100
    ) / 100
  );
}


/**
 * Add months to a Date.
 */
function addMonths(date, months) {
  const result = new Date(date);

  result.setMonth(
    result.getMonth() + months
  );

  return result;
}


/**
 * Convert Date to YYYY-MM-DD.
 */
function toISODate(date) {
  return date
    .toISOString()
    .slice(0, 10);
}


/**
 * Standard periodic amortisation payment.
 *
 * principal
 * annualRate → percentage, e.g. 8 means 8%
 * periodsPerYear → 4 for quarterly
 * numberOfPayments
 */
function calculatePeriodicPayment(
  principal,
  annualRate,
  periodsPerYear,
  numberOfPayments
) {
  if (principal <= 0) {
    return 0;
  }

  if (
    !Number.isFinite(annualRate) ||
    annualRate < 0
  ) {
    throw new Error(
      "annualRate must be a valid non-negative number"
    );
  }

  if (
    !Number.isFinite(periodsPerYear) ||
    periodsPerYear <= 0
  ) {
    throw new Error(
      "periodsPerYear must be positive"
    );
  }

  if (
    !Number.isFinite(numberOfPayments) ||
    numberOfPayments <= 0
  ) {
    throw new Error(
      "numberOfPayments must be positive"
    );
  }

  const periodicRate =
    annualRate /
    100 /
    periodsPerYear;


  // Zero-interest case.
  if (periodicRate === 0) {
    return (
      principal /
      numberOfPayments
    );
  }


  const payment =
    principal *
    periodicRate *
    Math.pow(
      1 + periodicRate,
      numberOfPayments
    ) /
    (
      Math.pow(
        1 + periodicRate,
        numberOfPayments
      ) - 1
    );


  return payment;
}


/**
 * Build quarterly repayment plan.
 *
 * loanAmount
 * scheme:
 *   interestRate
 *   tenureYears
 *   moratoriumMonths
 *
 * expectedCashFlow:
 *   monthly expected business cash flow
 *
 * options:
 *   startDate
 */
function build(
  loanAmount,
  scheme,
  expectedCashFlow,
  options = {}
) {

  const principal =
    assertNonNegative(
      loanAmount,
      "loanAmount"
    );


  if (principal <= 0) {
    return {
      quarterlyInstallment: 0,
      totalInterestPayable: 0,
      totalRepayment: 0,

      moratoriumMonths:
        Number(
          scheme?.moratoriumMonths || 0
        ),

      moratoriumEndDate:
        null,

      repaymentCapacity:
        "Unknown",

      monthlyExpectedCashFlow:
        null,

      quarterlyExpectedCashFlow:
        null,

      repaymentCoverageRatio:
        null,

      repaymentSchedule: [],

      calculationMethod:
        "Quarterly standard amortisation",

      deterministic: true,
    };
  }


  if (!scheme) {
    throw new Error(
      "scheme is required"
    );
  }


  const annualRate =
    Number(
      scheme.interestRate
    );


  const tenureYears =
    Number(
      scheme.tenureYears
    );


  const moratoriumMonths =
    Number(
      scheme.moratoriumMonths || 0
    );


  if (
    !Number.isFinite(annualRate) ||
    annualRate < 0
  ) {
    throw new Error(
      "scheme.interestRate is invalid"
    );
  }


  if (
    !Number.isFinite(tenureYears) ||
    tenureYears <= 0
  ) {
    throw new Error(
      "scheme.tenureYears is invalid"
    );
  }


  if (
    !Number.isFinite(moratoriumMonths) ||
    moratoriumMonths < 0
  ) {
    throw new Error(
      "scheme.moratoriumMonths is invalid"
    );
  }


  const periodsPerYear = 4;


  const totalPayments =
    Math.round(
      tenureYears *
      periodsPerYear
    );


  const quarterlyPayment =
    calculatePeriodicPayment(
      principal,
      annualRate,
      periodsPerYear,
      totalPayments
    );


  const startDate =
    options.startDate
      ? new Date(
          options.startDate
        )
      : new Date();


  if (
    Number.isNaN(
      startDate.getTime()
    )
  ) {
    throw new Error(
      "startDate is invalid"
    );
  }


  const moratoriumEndDate =
    addMonths(
      startDate,
      moratoriumMonths
    );


  let balance =
    principal;


  let totalInterest =
    0;


  const repaymentSchedule =
    [];


  // ---------------------------------------------------------------
  // Quarterly amortisation
  // ---------------------------------------------------------------

  for (
    let period = 1;
    period <= totalPayments;
    period += 1
  ) {

    const dueDate =
      addMonths(
        moratoriumEndDate,
        period * 3
      );


    const openingBalance =
      balance;


    const quarterlyInterest =
      openingBalance *
      (
        annualRate /
        100 /
        periodsPerYear
      );


    let principalComponent =
      quarterlyPayment -
      quarterlyInterest;


    // Protect against floating-point
    // overshoot in the final period.
    if (
      principalComponent >
      balance
    ) {
      principalComponent =
        balance;
    }


    // Prevent negative principal.
    principalComponent =
      Math.max(
        0,
        principalComponent
      );


    const actualPayment =
      principalComponent +
      quarterlyInterest;


    balance =
      Math.max(
        0,
        balance -
        principalComponent
      );


    totalInterest +=
      quarterlyInterest;


    repaymentSchedule.push({
      period,

      dueDate:
        toISODate(
          dueDate
        ),

      openingBalance:
        roundMoney(
          openingBalance
        ),

      principal:
        roundMoney(
          principalComponent
        ),

      interest:
        roundMoney(
          quarterlyInterest
        ),

      payment:
        roundMoney(
          actualPayment
        ),

      closingBalance:
        roundMoney(
          balance
        ),
    });


    if (
      balance <= 0.01
    ) {
      break;
    }
  }


  // ---------------------------------------------------------------
  // Expected cash flow
  // ---------------------------------------------------------------
  //
  // Input is monthly.
  //
  // Repayment is quarterly.
  //
  // Therefore:
  //
  // monthly cash flow × 3
  //          ↓
  // quarterly cash flow
  //
  // must be compared against:
  //
  // quarterly repayment.
  // ---------------------------------------------------------------

  const parsedCashFlow =
    Number(
      expectedCashFlow
    );


  const monthlyCashFlow =
    Number.isFinite(
      parsedCashFlow
    ) &&
    parsedCashFlow >= 0
      ? parsedCashFlow
      : null;


  const quarterlyCashFlow =
    monthlyCashFlow !== null
      ? monthlyCashFlow * 3
      : null;


  // ---------------------------------------------------------------
  // Repayment coverage
  // ---------------------------------------------------------------

  const repaymentRatio =
    quarterlyCashFlow !== null &&
    quarterlyPayment > 0
      ? quarterlyCashFlow /
        quarterlyPayment
      : null;


  let repaymentCapacity =
    "Unknown";


  if (
    repaymentRatio !== null
  ) {

    if (
      repaymentRatio >= 1.5
    ) {

      repaymentCapacity =
        "High";

    } else if (
      repaymentRatio >= 1.1
    ) {

      repaymentCapacity =
        "Medium";

    } else {

      repaymentCapacity =
        "Low";
    }
  }


  // ---------------------------------------------------------------
  // Final result
  // ---------------------------------------------------------------

  return {

    quarterlyInstallment:
      roundMoney(
        quarterlyPayment
      ),

    totalInterestPayable:
      roundMoney(
        totalInterest
      ),

    totalRepayment:
      roundMoney(
        principal +
        totalInterest
      ),

    moratoriumMonths,

    moratoriumEndDate:
      toISODate(
        moratoriumEndDate
      ),

    repaymentCapacity,

    monthlyExpectedCashFlow:
      monthlyCashFlow !== null
        ? roundMoney(
            monthlyCashFlow
          )
        : null,

    quarterlyExpectedCashFlow:
      quarterlyCashFlow !== null
        ? roundMoney(
            quarterlyCashFlow
          )
        : null,

    repaymentCoverageRatio:
      repaymentRatio !== null
        ? Math.round(
            repaymentRatio * 100
          ) / 100
        : null,

    repaymentSchedule,

    calculationMethod:
      "Quarterly standard amortisation",

    deterministic: true,
  };
}


module.exports = {
  build,
  calculatePeriodicPayment,
  roundMoney,
};