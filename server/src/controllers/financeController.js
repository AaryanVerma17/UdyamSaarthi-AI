const financialEngine =
  require("../services/financialEngine");

const schemeRouter =
  require("../services/schemeRouter");

const repaymentPlanner =
  require("../services/repaymentPlanner");

const workingCapitalPlanner =
  require("../services/workingCapitalPlanner");

async function calculate(
  req,
  res,
  next
) {
  try {
    const {
      ownCapital,
      ownCapitalPercentage,
      financingPercentage,
    } = req.body;

    const financials =
      financialEngine.calculate(
        ownCapital,
        {
          ownCapitalPercentage,
          financingPercentage,
        }
      );

    res
      .status(200)
      .json(financials);
  } catch (err) {
    next(err);
  }
}

async function routeScheme(
  req,
  res,
  next
) {
  try {
    const {
      projectCost,
    } = req.body;

    const scheme =
      schemeRouter.route(
        projectCost
      );

    res
      .status(200)
      .json(scheme);
  } catch (err) {
    if (
      err.code ===
      "SCHEME_NOT_APPLICABLE"
    ) {
      return res
        .status(422)
        .json({
          error:
            "SchemeNotApplicable",

          message:
            err.message,

          projectCost:
            err.projectCost,

          maxConfiguredProjectCost:
            err.maxConfiguredProjectCost,
        });
    }

    next(err);
  }
}

async function repaymentPlan(
  req,
  res,
  next
) {
  try {
    const {
      loanAmount,
      scheme,
      expectedCashFlow,
      startDate,
    } = req.body;

    const repayment =
      repaymentPlanner.build(
        loanAmount,
        scheme,
        expectedCashFlow,
        {
          startDate,
        }
      );

    res
      .status(200)
      .json(repayment);
  } catch (err) {
    next(err);
  }
}

async function workingCapital(
  req,
  res,
  next
) {
  try {
    const {
      projectCost,
      businessCategory,
    } = req.body;

    const result =
      workingCapitalPlanner.allocate(
        projectCost,
        businessCategory
      );

    res
      .status(200)
      .json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  calculate,
  routeScheme,
  repaymentPlan,
  workingCapital,
};