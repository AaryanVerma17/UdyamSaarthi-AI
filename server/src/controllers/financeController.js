const financialEngine = require("../services/financialEngine");
const schemeRouter = require("../services/schemeRouter");
const repaymentPlanner = require("../services/repaymentPlanner");
const workingCapitalPlanner = require("../services/workingCapitalPlanner");

function calculate(req, res, next) {
  try {
    const { ownCapital } = req.body;
    const result = financialEngine.calculate(ownCapital);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

function routeScheme(req, res, next) {
  try {
    const { projectCost } = req.body;
    const result = schemeRouter.route(projectCost);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

function repaymentPlan(req, res, next) {
  try {
    const { loanAmount, scheme, expectedCashFlow } = req.body;
    const result = repaymentPlanner.build(loanAmount, scheme, expectedCashFlow);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

function workingCapital(req, res, next) {
  try {
    const { projectCost, businessCategory } = req.body;
    const result = workingCapitalPlanner.allocate(projectCost, businessCategory);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { calculate, routeScheme, repaymentPlan, workingCapital };
