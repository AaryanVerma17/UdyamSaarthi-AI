const express = require("express");
const { generate } = require("../controllers/feasibilityController");
const Report = require("../models/Report");
const { authGuard } = require("../middlewares/authGuard");

const router = express.Router();

router.post("/generate", generate);

router.get("/:reportId", authGuard, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) return res.status(404).json({ error: "NotFound", message: "Report not found" });
    res.status(200).json(report);
  } catch (err) {
    next(err);
  }
});

router.get("/user/:userId", authGuard, async (req, res, next) => {
  try {
    const reports = await Report.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (err) {
    next(err);
  }
});

router.delete("/:reportId", authGuard, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) return res.status(404).json({ error: "NotFound", message: "Report not found" });
    if (report.userId && String(report.userId) !== String(req.user.id)) {
      return res.status(403).json({ error: "Forbidden", message: "You do not own this report" });
    }
    await report.deleteOne();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
