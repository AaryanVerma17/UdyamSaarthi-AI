const mongoose = require("mongoose");

/**
 * Flexible document store for full feasibility reports (Module outputs 1-10 + AI narrative).
 * Mirrors Appendix C (Sample Feasibility Report JSON Schema) of the technical documentation.
 */
const reportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    input: {
      location: {
        village: String,
        block: String,
        district: String,
        state: String,
      },
      ownCapital: Number,
      businessCategory: String,
      language: { type: String, enum: ["hi", "en"], default: "en" },
    },
    viability: mongoose.Schema.Types.Mixed,
    localMarket: mongoose.Schema.Types.Mixed,
    competitorMapping: mongoose.Schema.Types.Mixed,
    opportunities: mongoose.Schema.Types.Mixed,
    pricing: mongoose.Schema.Types.Mixed,
    swot: mongoose.Schema.Types.Mixed,
    financials: mongoose.Schema.Types.Mixed,
    scheme: mongoose.Schema.Types.Mixed,
    repayment: mongoose.Schema.Types.Mixed,
    workingCapital: mongoose.Schema.Types.Mixed,
    risks: mongoose.Schema.Types.Mixed,
    finalRecommendation: String,
    narrative: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
