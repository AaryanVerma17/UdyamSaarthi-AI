# UdyamSaarthi-AI

> ### **Hyper-Local Business Advisory & Financial Structuring Platform for Rural Entrepreneurs**

**UdyamSaarthi-AI** is an AI-assisted business feasibility and financial decision-support platform designed for rural and semi-urban entrepreneurs in India.

The platform transforms a simple business idea into a structured, location-aware feasibility assessment by combining **local economic intelligence, business viability analysis, competition mapping, financial modelling, government-scheme routing, repayment planning, risk analysis, and localized pricing**.

The core objective is simple:

> **Help an entrepreneur understand whether a particular business makes sense in their location, given their available capital — and what they should do next.**

---

## 🚀 Why UdyamSaarthi-AI?

Many entrepreneurs choose businesses based on:

* Word-of-mouth recommendations
* Businesses that appear successful in nearby areas
* Generic internet advice
* Incomplete understanding of competition
* Limited financial planning
* Lack of awareness of suitable government financing schemes

A business that works well in one location may not work equally well in another.

UdyamSaarthi-AI therefore focuses on:

```text
                    BUSINESS IDEA
                         +
                      LOCATION
                         +
                    OWN CAPITAL
                         ↓
              ┌─────────────────────┐
              │ UdyamSaarthi-AI     │
              │ Business Intelligence│
              └──────────┬──────────┘
                         ↓
       ┌─────────────────────────────────┐
       │ Local Market & Economic Context  │
       │ Demand & Competition             │
       │ Business Viability               │
       │ Financial Feasibility            │
       │ Government Schemes               │
       │ Repayment Capacity               │
       │ Working Capital                  │
       │ Risks & Pricing                  │
       └────────────────┬────────────────┘
                        ↓
             BUSINESS FEASIBILITY REPORT
                        ↓
              ACTIONABLE RECOMMENDATION
```

---

# 🎯 Core Objective

Given:

1. **Location**
2. **Own available capital**
3. **Proposed business**

UdyamSaarthi-AI evaluates whether the proposed business is locally and financially feasible and provides actionable guidance for moving forward.

The original product specification defines these as the three core user inputs. 

---

# ✨ Key Features

### 📍 Hyper-Local Business Intelligence

Analyzes the economic environment surrounding the proposed business location, including:

* Population and consumer base
* Local demand indicators
* Purchasing-power indicators
* Existing businesses
* Competition
* Local markets and distribution channels
* Agriculture/livestock activity
* Relevant economic indicators

The intended analysis is **location-specific rather than generic category-level advice**. 

---

### 📊 Business Viability Analysis

Evaluates whether the **specific business** is suitable for the selected location.

Depending on available data, the analysis can consider:

* Demand potential
* Revenue potential
* Operating costs
* Profitability
* Break-even
* Competition
* Seasonality
* Supply-chain exposure
* Business-specific risks

The system is designed to explain the reasoning behind the viability assessment rather than simply returning a number. 

---

### 🗺️ Competitor Mapping

Helps answer:

> **How crowded is this market?**

The system can identify similar businesses around the target location and classify the competitive environment as:

* 🟢 Under-served
* 🟡 Moderately competitive
* 🔴 Highly saturated

Competitors can be visualized geographically where mapping data is available. 

### Important data principle

UdyamSaarthi-AI distinguishes between:

> **Identifiable competitors**

and

> **The actual total number of businesses in the area.**

Online and publicly available data may not capture informal or unregistered businesses. Therefore, the system should communicate the coverage and confidence of competitor information rather than presenting an identified count as an absolute ground-truth count.

---

### 💡 Opportunity Finder

The system does not need to blindly validate the business entered by the user.

It can evaluate other opportunities that may better fit:

* Location
* Available capital
* Local demand
* Competition
* Risk
* Local resources
* Profitability potential

This helps move the platform from simple **business validation** toward **business discovery and decision support**. 

---

### 💰 Deterministic Financial Calculator

Financial calculations are handled through deterministic business logic rather than an LLM.

The financial layer can calculate:

* Project cost
* Own contribution
* Loan requirement
* Interest
* Tenure
* Repayment
* Cash-flow implications

The architecture explicitly separates financial calculations from AI-generated explanations. 

> **Financial calculations should always be traceable, reproducible and auditable.**

---

### 🏦 Government Scheme Router

The scheme-selection layer uses predefined rules rather than allowing an LLM to decide which financial scheme applies.

This makes scheme selection:

* Predictable
* Auditable
* Explainable
* Easier to update

The product specification explicitly assigns government scheme rules to the deterministic rules engine. 

---

### 📅 Repayment Planning

The repayment module evaluates whether the proposed business can realistically service its financing obligations.

It can consider:

* Installment/EMI
* Interest
* Total repayment
* Moratorium
* Repayment schedule
* Expected business cash flow
* Repayment capacity

The resulting assessment can be categorized as:

* **High**
* **Medium**
* **Low**



---

### 📦 Working Capital Planning

Instead of treating the entire project cost as one number, the system can help structure its use across areas such as:

* Equipment
* Infrastructure
* Initial inventory
* Working capital
* Marketing
* Logistics
* Emergency reserve

The final allocation is intended to be business-specific rather than blindly applying one universal percentage. 

---

### ⚠️ Risk Analysis

The platform identifies risks relevant to the proposed business and location.

Potential risks include:

* Seasonal demand fluctuations
* Raw-material availability
* Transportation constraints
* Electricity/water dependency
* Supplier dependency
* Buyer dependency
* Weather/agriculture-linked risks
* Competition
* Price volatility

The objective is not simply to discourage entrepreneurship, but to help the entrepreneur prepare for potential risks. 

---

### 💵 Localized Pricing

Instead of providing one generic price, the system can produce a recommended local price range using available evidence such as:

* Nearby market prices
* Mandi prices
* Competitor pricing
* Local purchasing-power indicators
* Input costs
* Expected margins

The output should include the **source and confidence level** wherever data permits. 

---

# 🧠 Evidence-Driven Architecture

One of the most important principles of UdyamSaarthi-AI is:

> **The LLM is not the source of truth for financial or scheme decisions.**

The intended processing pipeline is:

```text
REAL DATA
   ↓
DATA / INTELLIGENCE LAYER
   ↓
BUSINESS ANALYTICS
   ↓
DETERMINISTIC FINANCIAL ENGINE
   ↓
VERIFIED SCHEME RULES
   ↓
AI / LLM EXPLANATION LAYER
   ↓
FINAL BUSINESS FEASIBILITY REPORT
```

The responsibility of each layer is clearly separated:

| Concern                 | Responsible Layer          |
| ----------------------- | -------------------------- |
| Government scheme rules | Deterministic Rules Engine |
| Loan / EMI calculations | Financial Engine           |
| Geographic data         | Data Layer                 |
| Competitor information  | Data / Intelligence Layer  |
| Business profitability  | Analytics Engine           |
| Language & explanations | AI/LLM Layer               |

This separation is a core architectural constraint of the project. 

---

# 🌐 Data Strategy

UdyamSaarthi-AI is designed to progressively move toward an evidence-first data architecture.

### Preferred data hierarchy

```text
Official Government Data
        ↓
Verified / Recent Local Data
        ↓
Government Surveys / Research
        ↓
Reputable Secondary Sources
        ↓
Online Identifiable Business Data
        ↓
Model Estimates
```

Potential official data domains include:

* Census / ORGI
* MoSPI
* Agriculture departments
* Animal Husbandry departments
* State statistical departments
* District statistical reports
* NABARD
* RBI
* Mandi and market data
* Government scheme databases

The original specification identifies Census/district economic data, agricultural data, market/mandi information and business-location data as relevant inputs for local intelligence. 

---

# 🗓️ Data Freshness & Provenance

Because government datasets are released and updated at different frequencies, UdyamSaarthi-AI should not treat every dataset as equally current.

Important data should therefore carry metadata such as:

```text
Value
Source
Publisher
Dataset
Geographic Level
Data Year
Published Date
Retrieved Date
Coverage
Confidence
```

This allows the platform to distinguish between:

```text
Current data
     vs.
Older official data
     vs.
Estimated data
     vs.
Limited-coverage data
```

For Census information specifically, the system should use the **latest officially available dataset** and incorporate newer official Census releases as they become available, rather than inventing or assuming unavailable future values.

---

# 🔄 Saturated Business → Improvement → Re-evaluation

A highly competitive market should **not automatically result in "Don't Start."**

The intended decision process is:

```text
Existing Business
       ↓
Competition Analysis
       ↓
Market Saturation
       ↓
Identify Gaps
       ↓
Suggest Differentiation
       ↓
Recalculate Economics
       ↓
Re-evaluate Viability
       ↓
Final Recommendation
```

For example, a saturated dairy market could lead to opportunities such as:

* Home delivery
* Subscription-based milk delivery
* Paneer/curd/ghee production
* Cattle feed
* Underserved customer segments
* Local delivery optimization

Only if the improved/differentiated model remains unattractive should the system strongly recommend considering alternatives.

This makes the recommendation **constructive rather than binary**.

---

# 📑 Business Feasibility Report

The final output is designed as a structured **Business Feasibility Report**, rather than a generic chatbot response.

A typical report can contain:

```text
Business Feasibility Report
│
├── Executive Summary
│
├── Local Market Intelligence
│   ├── Consumer Base
│   ├── Demand
│   ├── Purchasing Power
│   └── Market Context
│
├── Market Landscape
│   ├── Competitor Analysis
│   ├── Identifiable Competitors
│   └── Market Saturation
│
├── Business Viability
│   ├── Viability Score
│   ├── Demand Potential
│   ├── Revenue Potential
│   ├── Cost Structure
│   └── Break-Even
│
├── Opportunity Analysis
│   ├── Market Gaps
│   ├── Differentiation
│   └── Alternative Businesses
│
├── Pricing Intelligence
│
├── Financial Outlook
│   ├── Own Capital
│   ├── Project Cost
│   ├── Loan
│   ├── Interest
│   └── Tenure
│
├── Repayment Analysis
│   ├── Installment
│   ├── Interest
│   ├── Cash Flow
│   └── Repayment Capacity
│
├── Working Capital Plan
│
├── Risk Analysis
│
├── Data Confidence & Sources
│
└── Final Recommendation
    ├── Proceed
    ├── Proceed with Conditions
    ├── Improve / Differentiate
    └── Consider Alternative
```

The original product definition similarly specifies local market analysis, opportunity, pricing, SWOT, financial structure, repayment, business economics, risk analysis and final recommendation as core report elements. 

---

# 🌍 Multilingual & Simple UX

The platform is designed for accessibility beyond technically sophisticated users.

### Initial languages

* 🇮🇳 Hindi
* 🇬🇧 English

Regional-language expansion can be added later.

The primary interface should avoid unnecessary financial jargon and communicate complex results in simple, understandable language. 

Example:

Instead of:

> DSCR indicates adequate debt-servicing capacity.

Prefer:

> **आपके अनुमानित व्यवसायिक नकदी प्रवाह से ऋण की किस्त चुकाने की क्षमता अच्छी है।**

---

# 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                         USER                                │
│             Location + Capital + Business                  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                           │
│       Intake • Dashboard • Report • Maps • Charts          │
└────────────────────────────┬────────────────────────────────┘
                             │ REST API
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                NODE.JS / EXPRESS BACKEND                    │
│                    Orchestration Layer                      │
│                                                             │
│  Validation • ML orchestration • Financial Engine           │
│  Scheme Router • Repayment • Working Capital               │
│  Confidence • Recommendation • Persistence                 │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
┌──────────────────────────┐      ┌───────────────────────────┐
│ Deterministic Engines    │      │ Python / FastAPI          │
│                          │      │ ML Service                │
│ Financial calculations   │      │                           │
│ Scheme rules             │      │ Viability                 │
│ Repayment                │      │ Competition               │
│ Working capital          │      │ Opportunity               │
└──────────────────────────┘      │ Risk                      │
                                  │ Pricing                   │
                                  │ NLP / Explanation         │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │ Data / Intelligence Layer │
                                  │                           │
                                  │ Government Data           │
                                  │ Local Data                │
                                  │ Market Data               │
                                  │ Geographic Data           │
                                  └───────────────────────────┘
```

The project documentation defines the same core flow from user input through location intelligence, business analysis, viability, financial structuring, repayment, AI explanation and final reporting. 

---

# 🛠️ Technology Stack

## Frontend

* React
* Vite
* JavaScript / JSX
* CSS
* React i18n architecture
* REST API integration
* Data visualization
* Interactive maps

## Backend

* Node.js
* Express.js
* Axios
* Jest
* MongoDB/Mongoose support
* PostgreSQL support

## AI / ML

* Python
* FastAPI
* Uvicorn
* Machine-learning/scoring components
* NLP
* RAG/explanation components
* Geospatial analysis

## Infrastructure

* Git
* GitHub
* Docker
* Docker Compose
* GitHub Actions
* Render / Vercel-compatible deployment architecture

The technical specification defines React/Vite, Node.js/Express, Python/FastAPI, MongoDB/PostgreSQL, Redis, Docker and GitHub Actions as the broader target technology architecture. 

---

# 📂 Project Structure

```text
UdyamSaarthi-AI/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── client/
│   ├── public/
│   │   └── locales/
│   │
│   └── src/
│       ├── components/
│       │   ├── forms/
│       │   ├── charts/
│       │   └── map/
│       │
│       ├── pages/
│       ├── services/
│       ├── store/
│       ├── i18n/
│       ├── App.jsx
│       ├── App.css
│       └── main.jsx
│
├── server/
│   ├── src/
│   │   ├── clients/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   │
│   ├── tests/
│   └── package.json
│
├── ml_service/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   ├── data/
│   │   ├── data_access/
│   │   ├── models/
│   │   ├── rag/
│   │   ├── schemas/
│   │   ├── utils/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── scripts/
│   └── data_ingestion/
│
├── shared/
│   └── constants/
│       └── schemeRules.js
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# ⚙️ Getting Started

## Prerequisites

Install:

* **Node.js 20+**
* **npm**
* **Python 3.11+**
* **Git**
* **Docker Desktop** *(optional but recommended)*

Optional depending on enabled persistence/features:

* MongoDB
* PostgreSQL
* Redis

---

# 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd UdyamSaarthi-AI
```

---

# 2. Configure Environment Variables

Copy the example environment file.

```bash
cp .env.example .env
```

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

Configure the required variables.

Example backend configuration:

```env
PORT=5000
ML_SERVICE_URL=http://127.0.0.1:8000
MONGODB_URI=<YOUR_MONGODB_URI>
POSTGRES_URL=<YOUR_POSTGRES_URL>
```

If a database is not required for the current local workflow, the corresponding variables may be left unconfigured if the application supports non-persistent operation.

### ⚠️ Never commit `.env`

Do not commit:

```text
.env
API keys
Database passwords
JWT secrets
LLM keys
Private credentials
```

---

# 3. Start the ML Service

Open a terminal:

```bash
cd ml_service
```

### Windows

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Linux/macOS

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

ML service:

```text
http://127.0.0.1:8000
```

Swagger/OpenAPI:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

---

# 4. Start the Backend

Open a **second terminal**:

```bash
cd server
npm install
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

---

# 5. Start the Frontend

Open a **third terminal**:

```bash
cd client
npm install
npm run dev
```

Vite will provide a local URL, normally:

```text
http://localhost:5173
```

Open it in your browser.

---

# 🐳 Running with Docker

If Docker Compose is configured for the current project:

```bash
docker compose up --build
```

To run in the background:

```bash
docker compose up --build -d
```

To stop:

```bash
docker compose down
```

Check running containers:

```bash
docker compose ps
```

---

# 🧪 Testing

Run backend tests:

```bash
cd server
npm test
```

The validated baseline currently contains:

```text
7 test suites
47 tests
```

with the baseline suite passing during development.

As the platform evolves, tests should cover:

* Financial calculations
* Scheme rules
* Repayment calculations
* Working capital
* Competition
* Dynamic viability
* Recommendation logic
* Data confidence
* ML-service communication
* Government-data adapters

---

# 🔌 Service Communication

During local development:

```text
React
 │
 │ http://localhost:5000
 ▼
Express
 │
 │ http://127.0.0.1:8000
 ▼
FastAPI
```

The backend communicates with the ML service using the configured:

```env
ML_SERVICE_URL
```

### Windows development note

If Uvicorn is listening on:

```text
127.0.0.1
```

prefer:

```env
ML_SERVICE_URL=http://127.0.0.1:8000
```

rather than `localhost` if your machine resolves `localhost` to IPv6 while the ML service is bound to IPv4.

---

# ☁️ Deployment

UdyamSaarthi-AI is designed to support a separated deployment architecture.

Recommended structure:

```text
┌─────────────────────────┐
│ React Frontend          │
│ Vercel / Render         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Node / Express Backend  │
│ Render / Railway        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ FastAPI ML Service      │
│ Render / Railway        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Database / Data Layer   │
└─────────────────────────┘
```

---

# 🚀 Render Deployment

## ML Service

Create a new **Web Service** in Render.

Set:

```text
Root Directory:
ml_service
```

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

After deployment, verify:

```text
https://<your-ml-service>.onrender.com/health
```

---

## Backend

Create another Render **Web Service**.

```text
Root Directory:
server
```

Build:

```bash
npm install
```

Start:

```bash
npm start
```

Use the actual `start` script defined in `server/package.json`.

Configure:

```env
ML_SERVICE_URL=https://<your-ml-service>.onrender.com
```

---

## Frontend

Create a Render **Static Site**.

```text
Root Directory:
client
```

Build:

```bash
npm install && npm run build
```

Publish directory:

```text
dist
```

Configure the frontend API URL to point to the deployed backend, using the environment-variable name expected by the current frontend API client.

For example:

```env
VITE_API_BASE_URL=https://<your-backend>.onrender.com
```

---

# 🔐 Production Environment

Production secrets should be configured through the hosting provider's environment-variable system.

Typical backend variables include:

```env
NODE_ENV=production
ML_SERVICE_URL=<DEPLOYED_ML_SERVICE_URL>
MONGODB_URI=<PRODUCTION_DATABASE>
POSTGRES_URL=<PRODUCTION_DATABASE>
CORS_ORIGIN=<FRONTEND_URL>
```

Never hard-code credentials into source code.

---

# 📊 Demo Scenario

A simple demonstration scenario is:

```text
Location:
Village X

Capital:
₹1,00,000

Business:
Dairy
```

The intended system journey is:

```text
Input
 ↓
Location Intelligence
 ↓
Market Analysis
 ↓
Competition
 ↓
Business Viability
 ↓
Financial Structure
 ↓
Scheme
 ↓
Repayment
 ↓
Working Capital
 ↓
Risk
 ↓
Pricing
 ↓
AI Explanation
 ↓
Final Recommendation
```

The technical specification uses a similar dairy/Village X scenario to demonstrate the end-to-end system. 

---

# 🛡️ Reliability & Trust Principles

UdyamSaarthi-AI is designed around the following principles:

### No fabricated financial decisions

Financial calculations should come from deterministic logic.

### No AI-generated scheme eligibility

Government scheme rules should come from verified rules/data.

### No false precision

If only 15 businesses can be identified from available data, the system should not imply that exactly 15 businesses exist.

### No hidden assumptions

Important assumptions should be surfaced to the user.

### No outdated data presented as current

Data should carry its source and vintage.

### No generic recommendation when local evidence is available

The system should prioritize location-specific evidence.

---

# 🔍 Explainability

Every major recommendation should ideally answer:

### Why?

Why did the business receive this viability score?

### What?

What data influenced the decision?

### When?

How recent is that data?

### Where?

Where did the information come from?

### How confident?

How reliable is the available evidence?

The original specification explicitly requires viability scores to include a plain-language explanation. 

---

# 📈 Example Recommendation Model

Instead of only:

```text
Viability Score: 42/100
Don't Start
```

the system should eventually produce something closer to:

```text
Viability Score
58 / 100

Assessment
Proceed with Conditions

Why?
• Local demand appears moderate
• Competition is relatively high
• Capital is sufficient for a small-scale model
• Current margins may be constrained

Market Gap
Home delivery appears less served than traditional retail.

Recommended Action
Consider a subscription-based delivery model
before committing to a larger setup.

Confidence
Medium

Data Coverage
12 identifiable businesses
across available sources
```

This is more useful because it turns the score into a **decision**, not just a prediction.

---

# 🌱 Project Philosophy

UdyamSaarthi-AI is built around a simple idea:

> ### **A business decision should be based on the realities of the place where the business will actually operate.**

The platform therefore combines:

**Local intelligence**

*

**Business economics**

*

**Financial discipline**

*

**Government schemes**

*

**Competition**

*

**Risk**

*

**Actionable recommendations**

into one decision-support system.

---

# 🏆 What Makes UdyamSaarthi-AI Different?

| Traditional Approach             | UdyamSaarthi-AI                         |
| -------------------------------- | --------------------------------------- |
| Generic business advice          | Location-specific analysis              |
| One-size-fits-all recommendation | Business + location + capital           |
| "Competitors = X"                | Identifiable competitors + confidence   |
| AI decides everything            | Deterministic + AI hybrid               |
| Generic loan calculation         | Rule-based financial structuring        |
| Static scheme information        | Source/version-aware scheme layer       |
| Reject saturated businesses      | Find gaps → differentiate → re-evaluate |
| Single price                     | Localized price range                   |
| Black-box score                  | Explainable score                       |
| Old/static datasets              | Data-source and freshness awareness     |
| Chatbot response                 | Structured feasibility report           |

---

# 🔮 Future Data Integrations

The platform is designed to progressively integrate authoritative data sources wherever technically and legally available, including:

* Census / ORGI
* MoSPI
* State government datasets
* District statistical reports
* Agriculture departments
* Animal Husbandry departments
* NABARD
* RBI
* Mandi/market data
* Government scheme databases
* Verified local business datasets

Where an official API does not exist, the system should use the officially published dataset through an appropriate ingestion pipeline rather than pretending that an API exists.

---

# 🤝 Contributing

Contributions are welcome.

### Development workflow

```bash
git checkout -b feature/your-feature
```

Make your changes.

Run tests:

```bash
cd server
npm test
```

Commit:

```bash
git add .
git commit -m "feat: describe your change"
```

Push:

```bash
git push origin feature/your-feature
```

Then create a Pull Request.

---

# ⚠️ Important Disclaimer

UdyamSaarthi-AI is a **decision-support and feasibility analysis platform**.

Its outputs should not be treated as:

* Guaranteed business success
* Guaranteed loan approval
* Guaranteed subsidy eligibility
* Guaranteed profitability
* Professional financial/legal advice

Actual financing, scheme eligibility, market conditions, regulatory requirements and business outcomes depend on the applicable authorities, lenders, local conditions and the accuracy/currentness of available data.

---

# 📄 Project Documentation

The complete technical specification covers the product definition, 10-module architecture, system flow, technology architecture, APIs, database strategy, multilingual design, risk assumptions and evaluation criteria.  

---

# 👥 Project

**UdyamSaarthi-AI**

### Hyper-Local Business Advisory & Financial Structuring Platform for Rural Entrepreneurs

**SIH 2026 — Problem Statement 26091**

**Ministry of Social Justice and Empowerment (MoSJE)**

---

<div align="center">

### **UdyamSaarthi-AI**

**From Business Idea → Local Evidence → Financial Feasibility → Actionable Decision**

</div>
