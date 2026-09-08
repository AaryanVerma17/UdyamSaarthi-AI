const SCHEME_RULE_STATUS = "provisional_assumption";

const SCHEME_RULE_SOURCE = {
  type: "development_assumption",
  authority: "not_verified",
  sourceUrl: null,
  version: "phase0-baseline-v1",
  effectiveFrom: null,
  verifiedAt: null,
};

const OWN_CAPITAL_PERCENTAGE = 10;

/**
 * Provisional development assumptions.
 *
 * DO NOT describe these as current official MoSJE terms.
 */
const MICRO_FINANCE_SCHEME = {
  name: "Micro Finance Scheme",
  maxProjectCost: 140000,
  interestRate: 6.5,
  tenureYears: 3,
  moratoriumMonths: 3,
  maxLoan: 125000,
  ownCapitalPercentage: OWN_CAPITAL_PERCENTAGE,
  ruleStatus: SCHEME_RULE_STATUS,
  ruleSource: { ...SCHEME_RULE_SOURCE },
};

const TERM_LOAN_SCHEME = {
  name: "Term Loan Scheme",
  minProjectCost: 140001,
  maxProjectCost: 5000000,
  interestRate: 8.0,
  tenureYears: 7,
  moratoriumMonths: 6,
  maxLoan: 4500000,
  ownCapitalPercentage: OWN_CAPITAL_PERCENTAGE,
  ruleStatus: SCHEME_RULE_STATUS,
  ruleSource: { ...SCHEME_RULE_SOURCE },
};

module.exports = {
  SCHEME_RULE_STATUS,
  SCHEME_RULE_SOURCE,
  OWN_CAPITAL_PERCENTAGE,
  MICRO_FINANCE_SCHEME,
  TERM_LOAN_SCHEME,
};