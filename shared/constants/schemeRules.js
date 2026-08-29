/**
 * shared/constants/schemeRules.js
 *
 * SINGLE SOURCE OF TRUTH for MoSJE scheme parameters.
 * Any change requires: official MoSJE/SCA authorization -> code review by
 * Full-Stack Lead -> updated unit tests in server/tests/ -> deployment with
 * a changelog entry. See Appendix B of the technical documentation.
 */

const OWN_CAPITAL_PERCENTAGE = 10; // Beneficiary margin-money contribution (%)

const MICRO_FINANCE_SCHEME = {
  name: "Micro Finance Scheme",
  maxProjectCost: 140000,
  interestRate: 6.5, // % per annum
  tenureYears: 3,
  moratoriumMonths: 3,
  maxLoan: 125000,
  ownCapitalPercentage: OWN_CAPITAL_PERCENTAGE,
};

const TERM_LOAN_SCHEME = {
  name: "Term Loan Scheme",
  minProjectCost: 140001,
  maxProjectCost: 5000000,
  interestRate: 8.0, // % per annum
  tenureYears: 7,
  moratoriumMonths: 6,
  maxLoan: 4500000,
  ownCapitalPercentage: OWN_CAPITAL_PERCENTAGE,
};

module.exports = {
  OWN_CAPITAL_PERCENTAGE,
  MICRO_FINANCE_SCHEME,
  TERM_LOAN_SCHEME,
};
