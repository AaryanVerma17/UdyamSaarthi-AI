/**
 * server/src/config/postgres.js — Nakkul
 *
 * PostgreSQL connection for relational financial records (loan
 * applications, EMI ledgers) per the hybrid MongoDB+PostgreSQL design in
 * the technical documentation. MongoDB stays the store for flexible
 * feasibility-report documents (see models/Report.js); Postgres is for
 * data that needs referential integrity and ACID guarantees.
 *
 * Uses plain `pg` (no ORM) to keep the dependency footprint small —
 * swap for Sequelize/Prisma if the team prefers a schema-migration
 * workflow as the relational schema grows.
 */
const { Pool } = require("pg");

let pool = null;

async function connectPostgres() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.warn("[postgres] POSTGRES_URL not set — skipping Postgres connection (Mongo-only mode).");
    return null;
  }

  try {
    pool = new Pool({ connectionString, connectionTimeoutMillis: 3000 });
    await pool.query("SELECT 1");
    console.log("[postgres] Connected to PostgreSQL");
    await ensureSchema();
    return pool;
  } catch (err) {
    console.error("[postgres] Connection failed:", err.message);
    console.warn("[postgres] Continuing without relational persistence.");
    pool = null;
    return null;
  }
}

async function ensureSchema() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS loan_applications (
      id SERIAL PRIMARY KEY,
      report_id VARCHAR(64) NOT NULL,
      user_id VARCHAR(64),
      own_capital NUMERIC NOT NULL,
      project_cost NUMERIC NOT NULL,
      loan_amount NUMERIC NOT NULL,
      scheme_name VARCHAR(100) NOT NULL,
      interest_rate NUMERIC NOT NULL,
      tenure_years INTEGER NOT NULL,
      moratorium_months INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS emi_ledger (
      id SERIAL PRIMARY KEY,
      loan_application_id INTEGER REFERENCES loan_applications(id) ON DELETE CASCADE,
      period INTEGER NOT NULL,
      principal NUMERIC NOT NULL,
      interest NUMERIC NOT NULL,
      due_date DATE NOT NULL,
      paid BOOLEAN DEFAULT FALSE,
      paid_at TIMESTAMP
    );
  `);
  console.log("[postgres] Schema verified (loan_applications, emi_ledger)");
}

function getPool() {
  return pool;
}

module.exports = { connectPostgres, getPool };
