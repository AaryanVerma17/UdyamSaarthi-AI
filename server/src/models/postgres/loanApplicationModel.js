/**
 * server/src/models/postgres/loanApplicationModel.js — Nakkul
 *
 * Plain query functions over the loan_applications / emi_ledger tables
 * (see config/postgres.js for schema). Kept as functions rather than a
 * class/ORM model to match the lightweight `pg` setup — swap for
 * Sequelize/Prisma models later if the team wants migrations.
 */
const { getPool } = require("../../config/postgres");

async function createLoanApplication({
  reportId,
  userId,
  ownCapital,
  projectCost,
  loanAmount,
  scheme,
}) {
  const pool = getPool();
  if (!pool) {
    console.warn("[loanApplicationModel] Postgres not connected — skipping relational persistence.");
    return null;
  }

  const result = await pool.query(
    `INSERT INTO loan_applications
      (report_id, user_id, own_capital, project_cost, loan_amount, scheme_name, interest_rate, tenure_years, moratorium_months)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      String(reportId),
      userId ? String(userId) : null,
      ownCapital,
      projectCost,
      loanAmount,
      scheme.name,
      scheme.interestRate,
      scheme.tenureYears,
      scheme.moratoriumMonths,
    ]
  );
  return result.rows[0].id;
}

async function insertEmiLedger(loanApplicationId, repaymentSchedule) {
  const pool = getPool();
  if (!pool || !loanApplicationId) return;

  const insertPromises = repaymentSchedule.map((entry) =>
    pool.query(
      `INSERT INTO emi_ledger (loan_application_id, period, principal, interest, due_date)
       VALUES ($1, $2, $3, $4, $5)`,
      [loanApplicationId, entry.period, entry.principal, entry.interest, entry.dueDate]
    )
  );
  await Promise.all(insertPromises);
}

async function getLoanApplicationByReportId(reportId) {
  const pool = getPool();
  if (!pool) return null;

  const result = await pool.query(
    `SELECT * FROM loan_applications WHERE report_id = $1`,
    [String(reportId)]
  );
  return result.rows[0] || null;
}

module.exports = { createLoanApplication, insertEmiLedger, getLoanApplicationByReportId };
