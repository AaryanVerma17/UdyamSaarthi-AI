const express = require("express");
const {
  calculate,
  routeScheme,
  repaymentPlan,
  workingCapital,
} = require("../controllers/financeController");

const router = express.Router();

router.post("/calculate", calculate);           // Module 5
router.post("/route-scheme", routeScheme);      // Module 6
router.post("/repayment-plan", repaymentPlan);  // Module 7
router.post("/working-capital", workingCapital); // Module 8

module.exports = router;
