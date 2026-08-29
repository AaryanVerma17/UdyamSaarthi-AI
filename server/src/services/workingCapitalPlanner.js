/**
 * Module 8 — Working Capital Planning (Deterministic, template-driven)
 * Allocates the total Project Cost across cost heads using a business-specific
 * template. Falls back to a conservative default template if the business
 * category has no dedicated template (per the "graceful degradation" rule
 * in the technical documentation).
 */
const { InvalidInputError } = require("../middlewares/errorHandler");

const TEMPLATES = {
  Dairy: { equipment: 0.4, infrastructure: 0.2, initialInventory: 0.15, workingCapital: 0.15, marketing: 0.05, reserve: 0.05 },
  Tailoring: { equipment: 0.35, infrastructure: 0.15, initialInventory: 0.2, workingCapital: 0.2, marketing: 0.05, reserve: 0.05 },
  "Food Processing": { equipment: 0.45, infrastructure: 0.2, initialInventory: 0.15, workingCapital: 0.1, marketing: 0.05, reserve: 0.05 },
  Kirana: { equipment: 0.15, infrastructure: 0.15, initialInventory: 0.45, workingCapital: 0.15, marketing: 0.05, reserve: 0.05 },
  "Repair Shop": { equipment: 0.5, infrastructure: 0.15, initialInventory: 0.1, workingCapital: 0.15, marketing: 0.05, reserve: 0.05 },
};

const DEFAULT_TEMPLATE = {
  equipment: 0.4,
  infrastructure: 0.2,
  initialInventory: 0.15,
  workingCapital: 0.15,
  marketing: 0.05,
  reserve: 0.05,
};

function allocate(projectCost, businessCategory) {
  if (typeof projectCost !== "number" || projectCost <= 0) {
    throw new InvalidInputError("projectCost must be a positive number");
  }

  const template = TEMPLATES[businessCategory] || DEFAULT_TEMPLATE;
  const usedDefault = !TEMPLATES[businessCategory];

  const allocation = {};
  Object.entries(template).forEach(([head, pct]) => {
    allocation[head] = Math.round(projectCost * pct * 100) / 100;
  });

  return { ...allocation, usedDefaultTemplate: usedDefault };
}

module.exports = { allocate, TEMPLATES, DEFAULT_TEMPLATE };
