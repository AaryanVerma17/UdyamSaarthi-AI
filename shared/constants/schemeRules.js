/**
 * UdyamSaarthi-AI
 *
 * Phase 6 — Government Scheme Rule Registry
 *
 * IMPORTANT:
 * These values are the current UdyamSaarthi-AI project
 * specification values.
 *
 * They MUST NOT be represented as live government policy
 * until officially validated.
 *
 * This file is the single source of truth for configured
 * scheme parameters.
 */

const RULE_STATUS = {
  PROVISIONAL: "provisional",
  VERIFIED: "verified",
};

const SCHEME_RULE_VERSION = "ps-v1";

const COMMON = {
  source: "Current UdyamSaarthi-AI project specification",
  sourceAuthority: "MoSJE/SCA validation required",
  ruleStatus: RULE_STATUS.PROVISIONAL,
  ruleVersion: SCHEME_RULE_VERSION,
  lastVerified: null,
};

module.exports = {
  RULE_STATUS,

  SCHEME_RULE_VERSION,

  MICRO_FINANCE_SCHEME: {
    ...COMMON,

    code: "MICRO_FINANCE",
    name: "Micro Finance Scheme",

    minProjectCost: 0,
    maxProjectCost: 140000,

    interestRate: 6.5,
    tenureYears: 3,
    moratoriumMonths: 3,

    maxLoan: 125000,

    ownCapitalPercentage: 10,
    financingPercentage: 90,
  },

  TERM_LOAN_SCHEME: {
    ...COMMON,

    code: "TERM_LOAN",
    name: "Term Loan Scheme",

    minProjectCost: 140001,
    maxProjectCost: 5000000,

    interestRate: 8.0,
    tenureYears: 7,
    moratoriumMonths: 6,

    maxLoan: 4500000,

    ownCapitalPercentage: 10,
    financingPercentage: 90,
  },
};