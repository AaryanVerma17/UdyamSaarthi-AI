# UdyamSaarthi-AI

Hyper-Local Business Advisory & Financial Structuring Platform for Rural Entrepreneurs
SIH 2026 | PS 26091 | Ministry of Social Justice and Empowerment (MoSJE)

This repository is the working scaffold for the architecture described in the project's
Technical Documentation. It is intentionally runnable end-to-end out of the box:

- `client/` — React (Vite) frontend: 3-field intake form + feasibility report view
- `server/` — Node/Express orchestration API: deterministic Financial Engine (M5),
  Scheme Router (M6), Repayment Planner (M7), Working Capital Planner (M8), and the
  master `/feasibility/generate` endpoint that calls the ML service for M1-M4, M9, M10
- `ml_service/` — Python/FastAPI microservice: currently ships **rule-based mock
  implementations** of Modules 1-4, 9, 10 and the AI Advisor explanation endpoint, with
  the exact request/response contracts from the technical documentation. Swap the mock
  logic inside each `app/api/v1/*.py` file for real trained models / LLM calls as they're
  built — the contracts (Pydantic schemas) are already the ones the server expects.
- `shared/constants/schemeRules.js` — single source of truth for scheme thresholds/rates
- `scripts/` — placeholders for data ingestion and PDF report generation

## What's a working MVP here vs. a TODO for your team

**Working out of the box:**
- Full three-field flow: Location + Own Capital + Business → feasibility report
- Deterministic math for Financial Calculator, Scheme Router, Repayment Planner,
  Working Capital Planner (unit-tested)
- Mock-but-contract-correct responses for the ML modules, so the whole pipeline runs
  end-to-end today
- MongoDB persistence of generated reports
- Hindi/English UI strings via i18next

**Left as TODOs for the team (per the ownership map in the docs):**
- Real trained models for Viability (M2), Opportunity Finder (M4), Pricing (M10), Risk (M9) — Kavya
- Real geo/competitor data + Leaflet map wiring — Kavya, Aanya
- PostgreSQL for relational financial records, Redis/BullMQ job queue — Nakkul
- Real LLM call in `nlp_explain.py` (Anthropic/OpenAI) — currently returns a templated narrative
- RAG/vector-store layer for grounding M1 and M10 — Aaryan
- PDF report generation — Piyush

## Quick Start

See the "Getting Started" section below, or the full instructions at the end of this
document for running everything with Docker Compose in one command.
