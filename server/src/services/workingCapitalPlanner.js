/**
 * Module 8 — Working Capital Planner
 *
 * Phase 6
 *
 * These percentages are planning assumptions.
 * They are NOT government scheme rules.
 *
 * The final report must describe them as:
 *
 * "Illustrative project allocation based on
 *  the selected business category."
 */

const {
  InvalidInputError,
} = require("../middlewares/errorHandler");

const TEMPLATES = {
  Dairy: {
    equipment: 0.40,
    infrastructure: 0.20,
    initialInventory: 0.15,
    workingCapital: 0.15,
    marketing: 0.05,
    reserve: 0.05,
  },

  Kirana: {
    equipment: 0.15,
    infrastructure: 0.15,
    initialInventory: 0.40,
    workingCapital: 0.15,
    marketing: 0.05,
    reserve: 0.10,
  },

  Tailoring: {
    equipment: 0.45,
    infrastructure: 0.15,
    initialInventory: 0.15,
    workingCapital: 0.15,
    marketing: 0.05,
    reserve: 0.05,
  },

  "Food Processing": {
    equipment: 0.40,
    infrastructure: 0.20,
    initialInventory: 0.15,
    workingCapital: 0.15,
    marketing: 0.05,
    reserve: 0.05,
  },

  "Repair Shop": {
    equipment: 0.35,
    infrastructure: 0.15,
    initialInventory: 0.20,
    workingCapital: 0.15,
    marketing: 0.05,
    reserve: 0.10,
  },

  DEFAULT: {
    equipment: 0.30,
    infrastructure: 0.20,
    initialInventory: 0.20,
    workingCapital: 0.15,
    marketing: 0.05,
    reserve: 0.10,
  },
};

const HEADS = [
  "equipment",
  "infrastructure",
  "initialInventory",
  "workingCapital",
  "marketing",
  "reserve",
];

function roundMoney(value) {
  return (
    Math.round(
      (Number(value) + Number.EPSILON) * 100
    ) / 100
  );
}

function validateTemplate(template) {
  const total =
    HEADS.reduce(
      (sum, head) =>
        sum +
        Number(
          template[head] || 0
        ),
      0
    );

  return (
    Math.abs(total - 1) <
    0.000001
  );
}

function allocate(
  projectCost,
  businessCategory
) {
  const cost =
    Number(projectCost);

  if (
    !Number.isFinite(cost) ||
    cost <= 0
  ) {
    throw new InvalidInputError(
      "projectCost must be a positive number"
    );
  }

  const template =
    TEMPLATES[
      businessCategory
    ] ||
    TEMPLATES.DEFAULT;

  const usedDefaultTemplate =
    !TEMPLATES[
      businessCategory
    ];

  if (
    !validateTemplate(
      template
    )
  ) {
    throw new Error(
      "Working capital template must total 100%"
    );
  }

  const allocation = {};

  for (
    const head of HEADS
  ) {
    allocation[head] =
      roundMoney(
        cost *
          Number(
            template[head]
          )
      );
  }

  /*
   * Correct rounding drift so that
   * allocation total equals project cost.
   */
  const allocatedTotal =
    HEADS.reduce(
      (sum, head) =>
        sum +
        allocation[head],
      0
    );

  const difference =
    roundMoney(
      cost -
        allocatedTotal
    );

  allocation.reserve =
    roundMoney(
      allocation.reserve +
        difference
    );

  const total =
    roundMoney(
      HEADS.reduce(
        (sum, head) =>
          sum +
          allocation[head],
        0
      )
    );

  return {
    ...allocation,

    total,

    businessCategory,

    templateUsed:
      usedDefaultTemplate
        ? "DEFAULT"
        : businessCategory,

    usedDefaultTemplate,

    planningBasis:
      "Internal planning estimate",

    assumptionStatus:
      "assumption",

    governmentRule:
      false,

    deterministic:
      true,

    warning:
      "Allocation is a planning estimate and is not a government-prescribed cost structure.",

    displayLabel:
      "Illustrative project allocation based on the selected business category.",
  };
}

module.exports = {
  allocate,
  TEMPLATES,
  DEFAULT_TEMPLATE:
    TEMPLATES.DEFAULT,
};