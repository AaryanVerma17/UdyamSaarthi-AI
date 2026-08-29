Good — here's the exhaustive version, mapping every single file in the repo to whoever owns it.

# UdyamSaarthi-AI

**Hyper-Local Business Advisory & Financial Structuring Platform for Rural Entrepreneurs**
SIH 2026 | PS 26091 | Ministry of Social Justice and Empowerment (MoSJE)

> ⏰ **Target: fully working, demo-ready by September 4, 2026.**

---

## Architecture at a Glance

```
udyamsaarthi-ai/
├── .github/workflows/ci.yml
├── .env.example
├── .gitignore
├── README.md
├── docker-compose.yml
├── client/            → React (Vite) frontend
├── server/            → Node/Express orchestration API + deterministic engines
├── ml_service/        → Python/FastAPI ML/NLP microservice
├── shared/constants/  → single source of truth for scheme rules
└── scripts/           → data ingestion + PDF report generation
```

**Branching rule for everyone:**
```bash
git checkout main
git pull
git checkout -b <your-branch-name>
# ... work ...
git add .
git commit -m "clear message"
git push -u origin <your-branch-name>
# open a PR on GitHub into main → get it reviewed → merge
```

---

## 🧑‍💻 Himanshi — Responsive UI & Forms

**Branch name:** `himanshi/responsive-ui`

| File | What's there now | What you need to change |
|---|---|---|
| `client/src/components/forms/IntakeForm.jsx` | Working 3-field form (village/block/district/state, ownCapital, businessCategory dropdown), no validation styling | Add validation feedback (red border/message if `ownCapital` ≤ 0, required-field errors on blur), improve spacing for small screens |
| `client/src/pages/Home.jsx` | Renders header, form, error banner, report, reset button — desktop-first layout | Add responsive breakpoints so header/form stack cleanly under ~480px; test the language-switch buttons don't overlap the title on mobile |
| `client/src/App.css` | All current styling — `.intake-form`, `.field-group`, `.app-header`, `.report`, `.badge`, `.viability-gauge`, etc. | Add `@media (max-width: 600px)` rules for `.page` padding, `.intake-form` field spacing, `.report__section` padding; check `.viability-gauge__ring` (120px) doesn't overflow narrow screens |

**What to do, step by step:**
1. Open Chrome DevTools → device toolbar → test at 375px and 414px widths
2. Fix the intake form first (it's the first thing every judge/user sees)
3. Once Aanya's map component lands, test the Report page layout end-to-end on mobile
4. Cross-browser check: Chrome, Firefox, Safari (or at least Chrome + one other)

**Commands:**
```bash
git checkout -b himanshi/responsive-ui
cd client
npm install
npm run dev
```

---

## 🧑‍💻 Aanya — React Frontend, i18n, Maps, Git/CI, Deployment

**Branch name:** `aanya/frontend-i18n-deploy`

| File | What's there now | What you need to change |
|---|---|---|
| `client/src/i18n/index.js` | i18next initialized with `en`/`hi` resources, default language `en` | Extend as new report fields get added by other modules — keep both translation files in sync |
| `client/public/locales/en/translation.json` | Keys for `appTitle`, `tagline`, `form.*`, `report.*` (viabilityScore, projectCost, loanAmount, scheme, quarterlyInstallment, recommendation, proceed/proceed_with_caution/not_recommended) | Add keys for any new UI text (e.g. competitor map labels, opportunity finder labels, working capital section headers) |
| `client/public/locales/hi/translation.json` | Hindi translations mirroring the English keys | Same additions, translated |
| `client/src/components/charts/ViabilityGauge.jsx` | Circular gauge using `conic-gradient`, color-coded green/yellow/red by score | Polish visual design if time allows; not urgent |
| `client/src/components/map/` | **Empty folder — doesn't exist yet, you create it** | Build `CompetitorMap.jsx` here using Leaflet, consuming `competitorMapping.points` (array of `{lat, lng, name, category}`) from the report response in `client/src/pages/Report.jsx` |
| `client/src/pages/Report.jsx` | Currently shows competitor count + classification as plain text (`§ Competitor Mapping`), no map | You'll add `<CompetitorMap points={competitorMapping.points} />` here once your component exists |
| `client/package.json` | Has `react`, `react-dom`, `axios`, `i18next`, `react-i18next`, `zustand` | Add `leaflet` and `react-leaflet` |
| `.github/workflows/ci.yml` | Runs `server-tests`, `ml-service-lint`, `client-build` jobs on PR/push to `main`/`develop` | Extend if you add new build/lint steps; keep it green |

**What to do, step by step:**
1. `npm install leaflet react-leaflet` inside `client/`
2. Build `CompetitorMap.jsx` — a Leaflet map centered on the average of `points`, with a marker per competitor, colored by classification (🟢/🟡/🔴)
3. Wire it into `Report.jsx`'s Competitor Mapping section
4. Fill in any missing i18n keys as they come up from other people's PRs
5. Set up Vercel: connect this GitHub repo, set root directory to `client/`, confirm PR preview builds work

**Commands:**
```bash
git checkout -b aanya/frontend-i18n-deploy
cd client
npm install
npm install leaflet react-leaflet
npm run dev
```

---

## 🧑‍💻 Kavya — ML Models (Viability, Competitor, Opportunity, Pricing, Risk)

**Branch name:** `kavya/ml-models-m2-m4-m9-m10`

| File | What's there now | What you need to change |
|---|---|---|
| `ml_service/app/api/v1/viability.py` | `score_viability()` — mock heuristic using a hardcoded `BUSINESS_BASE_SCORE` dict minus a density penalty | Replace with the trained scikit-learn/XGBoost model. Keep the function name, keep returning a `ViabilityResponse` (score, label, explanation, breakEvenMonths, expectedCashFlow, drivers, swot) |
| `ml_service/app/api/v1/competitor_mapping.py` | `map_competitors()` — mock random points scattered around a hardcoded lat/lng, classification by density thresholds (≤3 under-served, ≤7 moderate, >7 saturated) | Replace random point generation with real DBSCAN clustering over actual geo-tagged business data. Keep returning `CompetitorMappingResponse` (count, classification, points, dataConfidenceNote) |
| `ml_service/app/api/v1/opportunity.py` | `rank_opportunities()` — hardcoded `ALTERNATIVE_POOL` dict (e.g. Dairy → Dairy Feed Distribution 84, Tailoring 78...) and `IMPROVEMENT_SUGGESTIONS` dict | Replace with real multi-business scoring (re-run the viability model per candidate business). Keep the improvement-suggestions logic — this came from the team's "don't reject saturated businesses outright" decision |
| `ml_service/app/api/v1/pricing.py` | `recommend_pricing()` — hardcoded `PRICE_TABLE` dict (Dairy → ₹30–45/litre, etc.) | Replace with a real regression model over local mandi/competitor price data. Keep `range`, `unit`, `confidence`, `basedOn` fields |
| `ml_service/app/api/v1/risk.py` | `analyze_risks()` — hardcoded `COMMON_RISKS` for Dairy + `DEFAULT_RISKS` fallback | Replace with the rule+ML hybrid classifier. Keep each risk as `{type, severity, description, mitigation}` |
| `ml_service/app/schemas/models.py` | Pydantic models: `GeoContext`, `ViabilityResponse`, `CompetitorMappingResponse`, `OpportunityResponse`, `RiskResponse`, `PricingResponse`, `ExplainRequest/Response` | **Don't change field names/types here without telling Aaryan** — the Node server's `mlServiceClient.js` expects these exact shapes |
| `ml_service/app/ml_models/` | **Empty folder — you create the contents** | Put trained model files here (`.pkl`, `.onnx`), load them at module import time in the relevant `api/v1/*.py` file |
| `ml_service/requirements.txt` | `fastapi`, `uvicorn`, `pydantic`, `python-dotenv` | Add `scikit-learn`, `xgboost`, `pandas`, and anything else your models need |

**Important:** the contract (Pydantic schema) is what lets everyone else keep working while you swap mock → real logic underneath. Change the *implementation*, not the *shape*, unless you coordinate with Aaryan.

**Commands:**
```bash
git checkout -b kavya/ml-models-m2-m4-m9-m10
cd ml_service
python -m venv venv && source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install scikit-learn xgboost pandas
# add these three to requirements.txt once confirmed:
# echo "scikit-learn==1.5.2" >> requirements.txt  (check actual version installed)
uvicorn app.main:app --reload --port 8000
```

---

## 🧑‍💻 Nakkul — Database Architecture & Financial Data Models

**Branch name:** `nakkul/db-postgres-repayment-wc`

| File | What's there now | What you need to change |
|---|---|---|
| `server/src/config/db.js` | Connects to MongoDB only, with a 3-second `serverSelectionTimeoutMS` and graceful fallback if it fails | Add a parallel `connectPostgres()` (new file, see below), call it alongside `connectDB()` in `server.js` |
| `server/src/config/postgres.js` | **Doesn't exist — you create it** | Postgres connection setup (via `pg` or an ORM like Sequelize/Prisma — your call), export a connect function |
| `server/src/models/User.js` | Mongoose schema: `name`, `phone` (unique), `passwordHash`, timestamps | Review whether User should move to Postgres instead (relational identity data) — your architectural call per the hybrid DB design |
| `server/src/models/Report.js` | Mongoose schema: flexible `Mixed` fields for `viability`, `localMarket`, `competitorMapping`, `opportunities`, `pricing`, `swot`, `financials`, `scheme`, `repayment`, `workingCapital`, `risks`, `finalRecommendation`, `narrative` | Keep in Mongo (this is the "flexible document store" side of the hybrid design) — no change needed unless you're restructuring |
| New: `server/src/models/postgres/LoanApplication.js`, `EMILedger.js` | **Don't exist — you create them** | Relational models for loan applications and EMI ledgers, per the hybrid MongoDB+PostgreSQL design in the docs |
| `server/src/services/repaymentPlanner.js` | `build()` — quarterly EMI via standard amortization formula, moratorium interest capitalized into principal, `classifyCapacity()` for High/Medium/Low | **Verify this against official scheme documentation** — the moratorium-interest-capitalization convention was flagged earlier as needing confirmation. This is now your call to finalize and document |
| `server/src/services/workingCapitalPlanner.js` | `TEMPLATES` object with 5 business categories (Dairy, Tailoring, Food Processing, Kirana, Repair Shop), `DEFAULT_TEMPLATE` fallback | Add more business-category templates as Kavya's viability model supports more categories |
| `server/tests/workingCapitalPlanner.test.js` | 3 tests: Dairy template allocation, default-template fallback, allocations sum to project cost | Add tests for any new templates you add |

**Commands:**
```bash
git checkout -b nakkul/db-postgres-repayment-wc
cd server
npm install
npm install pg   # or sequelize/prisma, your call
npm test         # confirm existing 10 tests still pass before you extend anything
```

---

## 🧑‍💻 Piyush — Data Ingestion, PDF Reports, Landing Page, Demo Data

**Branch name:** `piyush/data-ingestion-pdf-report`

| File | What's there now | What you need to change |
|---|---|---|
| `scripts/data_ingestion/README.md` | Placeholder note describing what's needed: Census 2027/2011, MoSPI, Agri/Animal Husbandry, State/District stats, NABARD, RBI, mandi data — official sources prioritized over Kaggle | Build the actual ingestion scripts here (Python). Output should feed `ml_service/app/data/` in a format `location_intelligence.py` can consume |
| `ml_service/app/data/` | **Empty folder — you populate it** | Store the ingested/processed datasets here (or point to an external data store if too large for the repo) |
| `ml_service/app/api/v1/location_intelligence.py` | `get_location_intelligence()` — mock data seeded by a hash of the village name string | Once your ingestion pipeline exists, Kavya or Aaryan will wire this function to read from `ml_service/app/data/` instead of generating mock numbers — coordinate with them on the exact data format |
| `scripts/report_pdf_generator/README.md` | Placeholder note suggesting Puppeteer (render React headlessly) or WeasyPrint (Python HTML-to-PDF) | Build the actual PDF generator here |
| `client/src/pages/Report.jsx` | Full report view — viability gauge, financial structure, working capital list, competitor mapping, opportunity finder, pricing, risk analysis, recommendation badge, narrative | Your PDF generator should mirror this exact structure/order so the PDF matches what's shown on screen |
| `client/src/pages/Home.jsx` | Header with title, tagline, language switch, form | Add a short landing/intro section above the form if there's time (not core-critical) |
| Demo dataset | Not a file yet — this is a coordination task | Prepare the exact Village X / Block Y / District Z / ₹1,00,000 / Dairy numbers so `location_intelligence.py`'s mock (or your real data) returns consistent, rehearsed numbers for the SIH demo |

**Commands:**
```bash
git checkout -b piyush/data-ingestion-pdf-report
cd scripts/data_ingestion
python -m venv venv && source venv/bin/activate
pip install requests pandas
```

---

## 🧑‍💻 Aaryan (You) — Architecture, Financial Engine, RAG, Final Integration

**Branch name:** `aaryan/rag-integration` (plus `aaryan/<fix-name>` for integration fixes)

| File | What's there now | What you need to change |
|---|---|---|
| `ml_service/app/rag/` | **Empty folder — you build it** | FAISS/Pinecone vector store grounding Module 1 (location intelligence) and Module 10 (pricing) with retrieved context before the LLM explains |
| `ml_service/app/api/v1/nlp_explain.py` | `explain()` — templated string-building narrative in Hindi/English, no real LLM call, derives `finalRecommendation` from a simple rule (`score ≥ 75` + capacity → proceed, etc.) | Wire in the real Anthropic/OpenAI call, feeding it your RAG-retrieved context alongside the pre-computed facts. **Keep the constraint**: this endpoint must never invent/alter a financial figure — only phrase what it's given |
| `server/src/controllers/feasibilityController.js` | `generate()` — the master orchestration sequence: calls `mlClient` for M1/M2/M3/M4/M9/M10, runs `financialEngine`/`schemeRouter`/`repaymentPlanner`/`workingCapitalPlanner` in-process, calls `mlClient.explain()`, persists to Mongo, has a `deriveRecommendation()` fallback if the explain call fails | This is your file to own end-to-end. Update it if RAG changes the explain payload shape, or if new modules get added to the sequence |
| `server/src/clients/mlServiceClient.js` | Axios wrapper functions: `getLocationIntelligence`, `scoreViability`, `mapCompetitors`, `rankOpportunities`, `analyzeRisks`, `recommendPricing`, `explain` | Keep in sync with whatever endpoint signatures Kavya/you change in `ml_service` |
| `server/src/services/financialEngine.js` | `calculate()` — Module 5, deterministic, `projectCost = ownCapital / 0.10`, `loanAmount = projectCost * 0.90` | Yours to maintain. Any change needs a second reviewer (Nakkul or a teammate) given how central this is |
| `server/src/services/schemeRouter.js` | `route()` — Module 6, deterministic, routes by `projectCost` against `shared/constants/schemeRules.js` thresholds | Same — yours to maintain, second reviewer required for changes |
| `shared/constants/schemeRules.js` | `MICRO_FINANCE_SCHEME` and `TERM_LOAN_SCHEME` constants — the single source of truth | Any change requires official MoSJE/SCA confirmation first, per the change-control note already in the file's comments |
| `server/tests/financialEngine.test.js`, `server/tests/schemeRouter.test.js` | 4 + 4 tests covering correct calculation, edge cases (zero/negative/non-numeric input), scheme boundaries | Add tests for any new logic you introduce |

**Commands:**
```bash
git checkout -b aaryan/rag-integration
cd ml_service
source venv/bin/activate
pip install faiss-cpu anthropic   # or pinecone-client, your call
```

---

## Root-Level Files (shared — coordinate before editing)

| File | Owner in practice | Notes |
|---|---|---|
| `.env.example` | Whoever adds a new required env var | Add your new variable here with a comment, so `.env` setup stays self-documenting for the team |
| `.gitignore` | No one edits this unless adding a new tool | Already excludes `node_modules/`, `dist/`, `.env`, `__pycache__/`, `venv/` |
| `docker-compose.yml` | Aaryan (integration), but flag Nakkul if Postgres/Redis services need adding | Currently defines `mongo`, `server`, `ml_service`, `client` — add `postgres` and `redis` services here once Nakkul's work lands |
| `.github/workflows/ci.yml` | Aanya | Runs server tests, ml_service import check, client build on every PR |
| `README.md` | This file — update it as the repo evolves | Keep the file-ownership tables current as folders get filled in |

---

## Running Each Service Manually

```bash
# ML service
cd ml_service && source venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Server
cd server && npm run dev

# Client
cd client && npm run dev
```

Or all at once: `docker-compose up --build`

---

## Timeline to September 4

- **Day 1–2**: everyone branches, gets their piece running locally against the existing mocks
- **Day 3–4**: swap mocks for real logic — Kavya's models, Nakkul's Postgres, Piyush's real data, Aaryan's RAG + real LLM call
- **Day 5**: full integration on `main`, demo dry-run with the Village X / ₹1,00,000 / Dairy scenario
- **Day 6**: bug fixes only — freeze new features

If your module is running behind on the day before submission, leave the mock in place and merge what you have — a working mock beats a half-finished real model in a live demo.