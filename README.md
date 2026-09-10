````markdown
# UdyamSaarthi-AI

### Hyper-Local Business Advisory & Financial Decision-Support Platform for Rural & Semi-Urban Entrepreneurs

> **Idea -> Evidence -> Feasibility -> Finance -> Decision**

UdyamSaarthi-AI is an AI-assisted business feasibility and decision-support platform designed to help rural and semi-urban entrepreneurs in India evaluate a business idea before investing their hard-earned capital.

Instead of providing generic business advice, UdyamSaarthi-AI combines:

- Location intelligence
- Local competition context
- Financial modelling
- Government scheme routing
- Business viability scoring
- Loan and repayment planning
- Working-capital planning
- Localized pricing
- Risk analysis
- AI-generated explanations
- Secure user authentication
- User-specific report management
- English and Hindi accessibility

The central question is:

> **"Given this business idea, this location, and this available capital - does the business make sense, and what should I consider before investing?"**

---

# SIH 2026 Project

## Problem Statement

**AI-Driven Hyper-Local Business Advisory and Financial Structuring Assistant for Rural Micro-Entrepreneurs**

UdyamSaarthi-AI addresses the challenge of fragmented and difficult-to-access business intelligence faced by rural and semi-urban entrepreneurs.

The platform brings together location context, competition, financial planning, government schemes, pricing, risks and business viability into a single decision-support workflow.

The objective is not to tell an entrepreneur that a business is guaranteed to succeed.

The objective is to help the entrepreneur understand:

- Whether the business appears feasible
- What the local market looks like
- What competition exists
- How much capital may be required
- How financing could be structured
- What repayment could look like
- Which government schemes may be relevant
- What risks should be considered
- How strong the available evidence is
- What should be considered before investing

---

# Demo & Presentation

## Demo Video

Project demo video:

https://drive.google.com/file/d/1SRYgfcMLP77qFkJXjmh_vgTFSUlpLlQC/view?usp=sharing

## Project Presentation

Project PPT:

https://drive.google.com/file/d/17j9Fa3xadDd8B4djPvrSrwwE_rFIG7qE/view?usp=sharing

## Live Application

Live application:

https://udyamsaarthi.onrender.com

## Documentation

Project documentation:

https://docs.google.com/document/d/1pjgLozCisl2lvO_ufANM0kiShyEWGxwHQZOiW4iofyg/edit?usp=sharing

---

# SIH 2026 Demonstration Scope

The current SIH 2026 implementation focuses on the complete core feasibility and decision-support workflow.

## Current Implementation

### Phase 1 - Real User + Problem + Workflow

The platform is designed around the actual decision faced by a rural or semi-urban entrepreneur.

### Phase 2 - Guided User-Centred Intake

The entrepreneur provides:

- Location
- Business category
- Available own capital

through a guided interface.

### Phase 3 - Government Data + Evidence

The platform provides government-scheme routing and communicates scheme status and evidence limitations.

### Phase 4 - Location & Local Market Intelligence

The platform evaluates the business in the context of the selected location.

### Phase 5 - Competition + Ground Reality

The platform provides competition classification and identifiable competitor mapping where information is available.

### Phase 6 - Financial + Government Scheme Engine

The financial engine structures:

- Project cost
- Own capital
- Financing requirement
- Loan
- Repayment
- Working capital
- Scheme context

### Phase 7 - Business Viability & Decision Engine

The platform combines the available analytical information into:

- Viability score
- Viability label
- Recommendation
- Confidence
- Key risks
- Financial context
- Evidence limitations

---

# Future Development

The architecture is designed to support additional functionality after the current SIH demonstration.

### Phase 8 - Market Gaps + Differentiation

### Phase 9 - Alternative Business Engine

### Phase 10 - Trust + Explainability + Human Override

### Phase 11 - Decision-Centric Flagship Report

### Phase 12 - Test Before You Invest

### Phase 13 - Production + Deployment + Pilot Readiness

These phases are described in detail later in this README.

---

# Problem Statement

Starting a small business can be a high-stakes decision for rural and semi-urban entrepreneurs.

Business decisions may be influenced by:

- Word-of-mouth recommendations
- Businesses that appear successful nearby
- Generic online advice
- Limited understanding of local competition
- Unclear demand conditions
- Poor financial planning
- Lack of knowledge about government financing schemes
- Difficulty estimating repayment capacity
- Limited access to structured business intelligence

A business that succeeds in one village, block or district may not perform equally well somewhere else.

Therefore, the problem is not simply:

> **"Which business is profitable?"**

It is:

> **"Which business is sensible for this entrepreneur, in this location, with this amount of capital?"**

UdyamSaarthi-AI is designed around that decision.

---

# Our Solution

The platform converts a small amount of entrepreneur input into a structured feasibility assessment.

```text
Business Idea
      +
Location
      +
Available Capital
      |
      v
+-------------------------------+
|        UdyamSaarthi-AI        |
|                               |
| Location Intelligence         |
| Competition Analysis          |
| Financial Modelling           |
| Government Scheme Routing     |
| Repayment Planning            |
| Pricing Intelligence          |
| Risk Analysis                 |
| AI Explanation                |
| User Authentication           |
+---------------+---------------+
                |
                v
       Business Feasibility
                +
        Financial Outlook
                +
        Decision Guidance
````

The platform is designed to distinguish between:

## Viability

How promising the business appears based on the available analytical inputs.

## Confidence

How strong and reliable the underlying evidence is.

A business can therefore have:

```text
Promising viability
+
Limited local evidence
=
Promising opportunity with lower confidence
```

Instead of hiding uncertainty, the system communicates it.

---

# Key Features

## 1. Guided Business Assessment

The user provides essential information through a simple guided workflow.

### Location

* Village
* Block
* District
* State

### Business

Examples include:

* Dairy
* Kirana
* Tailoring
* Food Processing
* Repair Shop
* Other supported business categories

### Capital

* Entrepreneur's available own capital

The objective is to minimize cognitive load for first-time or non-technical users.

---

# 2. Location Intelligence

Location is treated as a core decision variable.

The location intelligence layer can incorporate:

* Local economic context
* Consumer-base indicators
* Purchasing-power indicators
* Existing business density
* Geographical context
* Local market signals

This prevents the system from treating the same business as equally viable everywhere.

---

# 3. Competition Mapping

The platform can surface identifiable competitors and display available locations on an interactive map.

The competition layer provides:

* Competitor count where available
* Competition classification
* Identifiable competitor locations
* Map-based visualization
* Evidence and confidence context

Competition information is treated as available market evidence rather than absolute ground truth.

The system does not claim that an available competitor dataset is necessarily a complete census of every business in an area.

---

# 4. Financial Feasibility Engine

The financial engine performs deterministic calculations for important business-finance decisions.

It can structure:

* Project cost
* Own capital
* Financing requirement
* Loan amount
* Interest assumptions
* Tenure
* Repayment planning
* Quarterly installment estimates
* Working-capital allocation

The financial engine is deliberately separated from the AI explanation layer.

> **AI explains financial outputs; it does not become the source of financial truth.**

---

# 5. Government Scheme Routing

The platform can route entrepreneurs toward potentially relevant financing and support schemes based on business and financial context.

The architecture supports:

* Scheme eligibility rules
* Financing assumptions
* Interest-rate information
* Tenure information
* Scheme status
* Provisional-rule handling

Where official verification is unavailable, the platform communicates that limitation instead of presenting provisional information as guaranteed.

---

# 6. Working-Capital Planning

The platform can structure available capital across business requirements such as:

* Inventory
* Raw materials
* Equipment
* Operating expenses
* Other working-capital needs

The objective is to move beyond:

> "You need Rs. X."

toward:

> "Here is how your available capital could be structured."

---

# 7. Localized Pricing

The pricing layer provides a location-aware price range where evidence is available.

It communicates:

* Suggested range
* Unit
* Confidence
* Whether the value is estimated
* Data limitations

Estimated pricing is explicitly differentiated from verified evidence.

---

# 8. Business Viability Score

The decision engine combines relevant business indicators into a structured feasibility assessment.

The report can communicate:

* Viability score
* Viability label
* Recommendation
* Key financial indicators
* Competition context
* Repayment capacity
* Evidence limitations
* Confidence

The score is not a guarantee of business success.

It is intended as decision support.

---

# 9. Risk Analysis

The platform identifies relevant risks and provides mitigation guidance.

Potential categories include:

* Market risk
* Competition risk
* Financial risk
* Operational risk
* Supply-side risk
* Demand uncertainty
* Repayment risk

The objective is not merely:

> "There is risk."

but:

> **"What is the risk, why does it matter, and what can the entrepreneur do about it?"**

---

# 10. AI-Powered Explanation

AI is primarily used to make analytical outputs easier to understand.

The AI explanation layer can translate complex results into:

* Plain-language insights
* Business reasoning
* Key considerations
* Decision summaries
* Evidence limitations

The core design principle is:

> **AI explains the evidence; AI does not replace the evidence.**

---

# 11. English and Hindi Experience

The interface supports:

* English
* Hindi

The underlying business and financial data remains consistent while the visible user experience can be presented in the selected language.

This is important because accessibility involves both technology and comprehension.

---

# 12. User Authentication and Secure Reports

UdyamSaarthi-AI includes a user authentication system so that entrepreneurs can securely create accounts, sign in and maintain their own feasibility reports.

The authentication system provides:

* User registration
* User sign in
* Password-based authentication
* JWT authentication
* Protected API routes
* User-specific report ownership
* Report history
* Individual report retrieval
* Report deletion
* Logout
* User-to-user report isolation

---

# Sign In and Registration

When the application is opened, users can either sign in to an existing account or create a new account.

```text
+-----------------------+
|     UdyamSaarthi-AI   |
|                       |
|        Sign In        |
|                       |
| Phone Number          |
| [___________________] |
|                       |
| Password              |
| [___________________] |
|                       |
|      [ Sign In ]      |
|                       |
| Don't have an account?|
|      Create one       |
+-----------------------+
```

For new users:

```text
+-----------------------+
|     Create Account    |
|                       |
| Name                  |
| [___________________] |
|                       |
| Phone Number          |
| [___________________] |
|                       |
| Password              |
| [___________________] |
|                       |
|  [ Create Account ]   |
|                       |
| Already have account? |
|        Sign In        |
+-----------------------+
```

---

# User Registration

A new user provides:

* Name
* Phone number
* Password

The backend validates the required fields before creating the account.

Passwords are not stored as plain text.

The registration flow is:

```text
User
  |
  v
Enter Name
  |
  v
Enter Phone Number
  |
  v
Create Password
  |
  v
Validation
  |
  v
Password Hashing
  |
  v
User Account Created
  |
  v
JWT Generated
  |
  v
Authenticated Application
```

Duplicate phone-number registration is rejected.

---

# User Sign In

Existing users can sign in using:

* Phone number
* Password

The sign-in flow is:

```text
User
  |
  v
Enter Phone Number
  |
  v
Enter Password
  |
  v
Backend Authentication
  |
  v
Password Verification
  |
  v
JWT Token Generated
  |
  v
Authenticated Session
```

Invalid credentials are rejected.

---

# JWT Authentication

After successful registration or sign in, the backend generates a JSON Web Token.

The token is used to authenticate protected API requests.

```text
Sign In
   |
   v
Credentials Verified
   |
   v
JWT Token
   |
   v
Authenticated Session
   |
   v
Protected API Requests
```

The frontend attaches the token to protected requests using:

```text
Authorization: Bearer <JWT_TOKEN>
```

---

# Protected API Routes

Important user-specific operations require authentication.

Protected functionality includes:

```text
POST   /api/v1/feasibility/generate

GET    /api/v1/feasibility/user/:userId

GET    /api/v1/feasibility/:reportId

DELETE /api/v1/feasibility/:reportId
```

Unauthenticated requests to protected routes are rejected.

---

# User-Specific Reports

Every generated feasibility report is associated with the authenticated user.

The relationship is:

```text
User Account
     |
     +---- Report 1
     |
     +---- Report 2
     |
     +---- Report 3
     |
     +---- Report 4
```

This allows users to maintain a personal history of feasibility assessments.

---

# Report History

After signing in, users can access their previously generated reports.

```text
Sign In
   |
   v
User Account
   |
   v
Report History
   |
   +---- Report 1
   |
   +---- Report 2
   |
   +---- Report 3
```

The backend verifies that the requested reports belong to the authenticated user.

---

# Individual Report Access

A user can open an individual report using its report ID.

Before returning the report, the backend verifies:

```text
Authenticated User ID
        =
Report Owner ID
```

If the report belongs to another user, access is denied.

---

# User-to-User Data Isolation

UdyamSaarthi-AI implements ownership checks for user reports.

Example:

```text
User A
  |
  +---- Report A1
  +---- Report A2

User B
  |
  +---- Report B1
  +---- Report B2
```

User A cannot access User B's reports.

User B cannot access User A's reports.

An unauthorized attempt to access another user's report results in a `403 Forbidden` response.

---

# Report Deletion

Authenticated users can delete reports belonging to their own account.

The deletion flow is:

```text
User
  |
  v
Select Own Report
  |
  v
Ownership Verification
  |
  v
Delete Report
```

A user cannot delete another user's report.

---

# Logout

The application supports logout.

```text
Authenticated Session
        |
        v
      Logout
        |
        v
Authentication Data Cleared
        |
        v
Sign-In Screen
```

The user must sign in again to access protected functionality.

---

# Authentication Error Handling

The application provides user-friendly responses for common authentication failures.

## Missing Authentication

The protected endpoint rejects requests without an authentication token.

## Invalid Credentials

Incorrect phone numbers or passwords are rejected.

## Invalid or Expired Token

The user is asked to sign in again.

## Unauthorized Report Access

The backend rejects attempts to access reports belonging to another user.

## Duplicate Registration

A user cannot create multiple accounts using the same registered phone number.

---

# Authentication API

## Register

```text
POST /api/v1/auth/register
```

Example request:

```json
{
  "name": "Test User",
  "phone": "9999999999",
  "password": "********"
}
```

A successful registration returns:

* Authentication token
* User ID
* User name
* User phone number

---

# Sign In

```text
POST /api/v1/auth/login
```

Example request:

```json
{
  "phone": "9999999999",
  "password": "********"
}
```

A successful sign in returns:

* Authentication token
* User ID
* User name
* User phone number

---

# Generate Authenticated Report

```text
POST /api/v1/feasibility/generate
```

Requires:

```text
Authorization: Bearer <JWT_TOKEN>
```

The generated report is automatically associated with the authenticated user.

---

# Get User Reports

```text
GET /api/v1/feasibility/user/:userId
```

Requires authentication.

The backend verifies that the requested user ID matches the authenticated user.

---

# Get Individual Report

```text
GET /api/v1/feasibility/:reportId
```

Requires:

* Authentication
* Report ownership verification

---

# Delete Individual Report

```text
DELETE /api/v1/feasibility/:reportId
```

Requires:

* Authentication
* Report ownership verification

---

# Complete Authentication and Report Flow

```text
                         START
                           |
                           v
                  +----------------+
                  | Sign In /      |
                  | Create Account |
                  +-------+--------+
                          |
              +-----------+-----------+
              |                       |
              v                       v
          New User               Existing User
              |                       |
              v                       v
         Registration              Sign In
              |                       |
              +-----------+-----------+
                          |
                          v
                  JWT Authentication
                          |
                          v
                  Authenticated Session
                          |
                          v
                  Business Assessment
                          |
                          v
                  Generate Report
                          |
                          v
                 Report Linked to User
                          |
              +-----------+-----------+
              |                       |
              v                       v
        View Report              Report History
              |                       |
              v                       v
       Delete Own Report       View Own Reports
              |                       |
              +-----------+-----------+
                          |
                          v
                        Logout
                          |
                          v
                    Sign-In Screen
```

---

# End-to-End Decision Journey

```text
START
  |
  v
Create Account / Login
  |
  v
Enter Location
  |
  v
Select Business
  |
  v
Enter Available Capital
  |
  v
Analyse Local Context
  |
  v
Assess Competition
  |
  v
Model Financial Structure
  |
  v
Route Relevant Schemes
  |
  v
Estimate Repayment Capacity
  |
  v
Assess Pricing & Risks
  |
  v
Calculate Viability
  |
  v
Explain Evidence & Limitations
  |
  v
Generate Feasibility Report
  |
  v
Save Report to User Account
```

---

# What the User Receives

The final report is organized around the decision rather than simply presenting raw data.

## Decision Summary

* Viability score
* Recommendation
* Business context
* Location context
* Confidence

## Financial Outlook

* Project cost
* Own capital
* Loan requirement
* Repayment estimate
* Scheme context
* Working-capital structure

## Market Landscape

* Competition classification
* Identifiable competitors
* Competitor map
* Local pricing

## Opportunity and Risk

* Business opportunities
* Improvement suggestions
* Key risks
* Mitigation measures

## Evidence and Limitations

* Data sources and status
* Confidence indicators
* Missing information
* Evidence limitations

---

# UI/UX

The interface is designed as a real product experience rather than a technical dashboard.

## Landing Experience

* Premium visual identity
* Strong hero section
* Clear primary call-to-action
* Decision-preview card
* Trust and evidence indicators
* How-it-works section
* Responsive layout

## Guided Intake

* Three-step progress indicator
* Large form controls
* Business-selection cards
* Contextual helper text
* Inline validation
* Loading states
* Clear back and continue actions
* Mobile-friendly interaction

## Authentication Experience

* Sign In
* Create Account
* Password validation
* Authentication feedback
* Session persistence
* Logout

## Report Experience

* Decision-first report header
* Prominent viability score
* Recommendation status
* Financial summary cards
* Competition visualization
* Interactive competitor map
* Risk and mitigation presentation
* Evidence-confidence indicators
* Data-limitations section
* Start-over journey

---

# System Architecture

UdyamSaarthi-AI follows a three-service architecture.

```text
                         +----------------------+
                         |      User / Web      |
                         +----------+-----------+
                                    |
                                    v
                         +---------------------------+
                         | React + Vite Frontend     |
                         |                           |
                         | Forms                     |
                         | Authentication            |
                         | i18n                      |
                         | Report UI                 |
                         | Maps / Visualizations     |
                         +------------+--------------+
                                      |
                                  REST API
                                      |
                                      v
                         +---------------------------+
                         | Node.js + Express Backend |
                         |                           |
                         | Authentication            |
                         | Controllers               |
                         | Financial Engine           |
                         | Scheme Router              |
                         | Repayment Planner          |
                         | Working Capital Planner    |
                         | Confidence / Corrections  |
                         | Recommendation Gate        |
                         +--------+---------+---------+
                                  |         |
                                  v         v
                              MongoDB   PostgreSQL
                                  |
                                  v
                         +---------------------------+
                         | Python + FastAPI ML       |
                         | Service                   |
                         |                           |
                         | Location Intelligence     |
                         | Viability                 |
                         | Competition Mapping       |
                         | Opportunity Analysis      |
                         | Risk Analysis             |
                         | Pricing                   |
                         | NLP Explanation           |
                         +---------------------------+
```

---

# Technology Stack

## Frontend

* React
* Vite
* Zustand
* i18next
* react-i18next
* CSS
* React Leaflet

## Backend

* Node.js
* Express.js
* Axios
* MongoDB
* Mongoose
* PostgreSQL
* JWT
* bcrypt

## ML and Intelligence Service

* Python
* FastAPI
* Uvicorn
* NumPy
* Pandas
* SciPy
* scikit-learn
* Joblib
* NLTK
* GeoPy
* Sentence Transformers
* Google Gemini

## Data and Infrastructure

* MongoDB
* PostgreSQL
* Redis-ready architecture
* OpenStreetMap
* Leaflet
* Render
* GitHub Actions
* GitHub

---

# Project Structure

```text
UdyamSaarthi-AI/
|
├── client/                         # React + Vite frontend
│   ├── public/
│   │   └── locales/
│   │       ├── en/
│   │       └── hi/
│   └── src/
│       ├── components/
│       │   └── auth/
│       ├── pages/
│       ├── services/
│       ├── store/
│       ├── i18n/
│       ├── App.jsx
│       ├── App.css
│       └── main.jsx
|
├── server/                         # Node + Express backend
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
│   └── tests/
|
├── ml_service/                    # Python + FastAPI ML service
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   ├── schemas/
│   │   └── main.py
│   ├── requirements.txt
│   ├── runtime.txt
│   └── Dockerfile
|
├── scripts/
│   ├── data_ingestion/
│   └── report_pdf_generator/
|
├── shared/
│   └── constants/
|
├── .github/
│   └── workflows/
|
├── .env.example
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# Running Locally

## Prerequisites

Install:

* Node.js 18+ recommended
* npm
* Python 3.12
* MongoDB
* PostgreSQL if using finance and loan persistence locally
* Git

Verify:

```bash
node --version
npm --version
python --version
git --version
```

---

# 1. Clone the Repository

```bash
git clone https://github.com/AaryanVerma17/UdyamSaarthi-AI.git
cd UdyamSaarthi-AI
```

---

# 2. Configure Environment Variables

Create the required environment files from the provided examples.

Do not commit:

```text
.env
```

Do not commit files containing:

* API keys
* Database passwords
* JWT secrets
* Private tokens
* Service credentials

A typical backend configuration is:

```env
PORT=5000

MONGO_URI=<MongoDB connection string>

JWT_SECRET=<strong random secret>

ML_SERVICE_URL=http://127.0.0.1:8000

GEMINI_API_KEY=<Gemini API key>

POSTGRES_URL=<PostgreSQL connection string>

REDIS_URL=<Redis connection string if enabled>

MAP_TILE_API_KEY=<map/API key if required>
```

The frontend should point to the backend API:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

For Render:

```env
VITE_API_BASE_URL=https://YOUR-BACKEND-SERVICE.onrender.com/api/v1
```

---

# 3. Start the ML Service

Open a terminal:

```bash
cd ml_service
```

Create a virtual environment.

## Windows

```powershell
python -m venv venv
venv\Scripts\activate
```

## macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app.main:app --reload --port 8000
```

The ML service should be available at:

```text
http://127.0.0.1:8000
```

---

# 4. Start the Backend

Open another terminal:

```bash
cd server
npm install
```

Start the server:

```bash
npm run dev
```

The backend should run on:

```text
http://localhost:5000
```

The API base path is:

```text
/api/v1
```

Health check:

```text
http://localhost:5000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "udyamsaarthi-server"
}
```

---

# 5. Start the Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Vite will provide the local development URL, typically:

```text
http://localhost:5173
```

Open the URL in the browser.

---

# Local Service Communication

The local system works approximately as:

```text
Browser
   |
   v
React / Vite
   |
   v
http://localhost:5000/api/v1
   |
   v
Node / Express
   |
   v
http://127.0.0.1:8000
   |
   v
FastAPI ML Service
   |
   v
MongoDB / PostgreSQL
```

All required services should be running before testing report generation.

---

# Localhost and SIH Admin Laptop Compatibility

UdyamSaarthi-AI is designed to run on a local environment and is not tied to a single development laptop.

For the SIH demonstration, the repository can be cloned and configured on the designated admin laptop.

The application can be run in either of the following ways:

## Option 1 - Localhost on the Admin Laptop

The admin laptop can run:

```text
React Frontend
       |
       v
Node.js / Express Backend
       |
       v
Python / FastAPI ML Service
       |
       v
Configured Databases and APIs
```

The relevant services can run locally using the configured ports.

The frontend can communicate with the backend through:

```text
http://localhost:5000/api/v1
```

The backend can communicate with the ML service through:

```text
http://127.0.0.1:8000
```

## Option 2 - Render Deployment

The admin laptop can access the deployed Render application through a browser.

The deployed architecture is:

```text
Admin Laptop Browser
        |
        v
Render Frontend
        |
        v
Render Backend
        |
        v
Render ML Service
        |
        +------> MongoDB
        |
        +------> PostgreSQL
        |
        +------> Gemini / External APIs
```

## Environment Configuration Requirement

The application requires the correct environment variables and valid service endpoints.

Therefore:

> **With the correct `.env` details, required dependencies and service configuration, UdyamSaarthi-AI can run locally on the SIH admin laptop or be accessed through the Render deployment from the admin laptop.**

The project does not depend on the original developer laptop.

---

# Local Service Troubleshooting

Because UdyamSaarthi-AI consists of multiple services, temporary service-connection errors may occur if one of the services has stopped, restarted or is not reachable through the configured endpoint.

If the frontend displays an analysis-service error, check:

```text
1. ML service is running
2. Backend is running
3. Frontend is running
4. ML_SERVICE_URL is correct
5. VITE_API_BASE_URL is correct
6. Required environment variables are configured
7. Required ports are available
```

If the configuration is correct but a service has become stale or disconnected, restarting the affected services can restore communication.

Recommended restart sequence:

```text
Stop Frontend
Stop Backend
Stop ML Service

Start ML Service
Start Backend
Start Frontend
```

The ML service should use:

```bash
uvicorn app.main:app --reload --port 8000
```

---

# Testing

## Backend Tests

From:

```bash
cd server
```

Run:

```bash
npm test
```

The backend test suite covers important deterministic components such as:

* Financial engine
* Scheme routing
* Working-capital planning
* Data confidence
* Field corrections
* Competition classification
* Recommendation gating

## Frontend Build

From:

```bash
cd client
```

Run:

```bash
npm run build
```

A successful build confirms that the production frontend bundle can be generated.

## ML Service

From:

```bash
cd ml_service
```

Run:

```bash
pytest
```

if the ML test suite is configured in the local environment.

---

# Authentication Testing

The authentication workflow should be tested in the following order:

```text
Register
   |
   v
Login
   |
   v
Receive JWT
   |
   v
Generate Report
   |
   v
Report Saved Against User
   |
   v
Retrieve User Reports
```

Test that:

* Registration succeeds
* Duplicate registration is rejected
* Login succeeds with valid credentials
* Invalid credentials are rejected
* Protected endpoints reject missing authentication
* Users can access their own reports
* Users cannot access another user's reports
* Users can retrieve their report history
* Users can delete their own reports
* Logout clears the authentication session

---

# Two-User Security Test

The application can be tested with two separate users.

## User A

```text
Register User A
       |
       v
Sign In
       |
       v
Generate Report A
       |
       v
View Report A
```

## User B

```text
Register User B
       |
       v
Sign In
       |
       v
Attempt to access Report A
       |
       v
403 Forbidden
```

This verifies user-level report isolation.

---

# Complete SIH Demo Test Flow

Before the SIH demonstration, verify:

```text
1. Open Application
       |
       v
2. Register / Login
       |
       v
3. Enter Location
       |
       v
4. Select Business
       |
       v
5. Enter Own Capital
       |
       v
6. Generate Analysis
       |
       v
7. Location Intelligence
       |
       v
8. Competition Analysis
       |
       v
9. Financial Modelling
       |
       v
10. Government Scheme Routing
       |
       v
11. Repayment Planning
       |
       v
12. Working Capital Planning
       |
       v
13. Pricing
       |
       v
14. Risk Analysis
       |
       v
15. Viability Assessment
       |
       v
16. AI Explanation
       |
       v
17. Final Feasibility Report
       |
       v
18. Report Saved to User Account
```

---

# Health Checks

Before testing the complete application, verify:

```text
Frontend
   |
   v
Loads correctly

Backend
   |
   v
Running on configured PORT

ML Service
   |
   v
FastAPI responding

Database
   |
   v
Accessible

Gemini
   |
   v
Valid API key configured if AI explanation is enabled
```

---

# Deployment Architecture

The application supports separate deployment of:

1. React/Vite frontend
2. Node/Express backend
3. Python/FastAPI ML service

Typical production architecture:

```text
                  Internet
                     |
                     v
             +----------------+
             | React Frontend |
             +-------+--------+
                     |
                     v
             +----------------+
             | Express Backend|
             +-------+--------+
                     |
              +------+------+
              |             |
              v             v
           MongoDB      PostgreSQL
              |
              v
             +----------------+
             | FastAPI ML     |
             | Service        |
             +----------------+
```

---

# Render Deployment

UdyamSaarthi-AI can be deployed on Render as separate services.

## Frontend

Create a:

```text
Static Site
```

Typical settings:

```text
Root Directory:
client

Build Command:
npm install && npm run build

Publish Directory:
dist
```

Environment variable:

```env
VITE_API_BASE_URL=https://YOUR-BACKEND-SERVICE.onrender.com/api/v1
```

---

# Backend

Create a:

```text
Web Service
```

Typical settings:

```text
Root Directory:
server

Build Command:
npm install

Start Command:
npm start
```

Configure:

```env
PORT=<Render-provided PORT>

MONGO_URI=<MongoDB connection string>

POSTGRES_URL=<PostgreSQL connection string>

JWT_SECRET=<strong random secret>

ML_SERVICE_URL=https://YOUR-ML-SERVICE.onrender.com

GEMINI_API_KEY=<Gemini API key>
```

The backend must listen on the host and port provided by Render.

---

# ML Service

Create another:

```text
Web Service
```

Typical settings:

```text
Root Directory:
ml_service

Build Command:
pip install -r requirements.txt

Start Command:
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

The Python runtime is pinned through:

```text
ml_service/runtime.txt
```

The current ML dependency stack uses Python 3.12.

---

# Localhost vs Render

| Aspect                | Localhost                        | Render                       |
| --------------------- | -------------------------------- | ---------------------------- |
| Frontend              | Vite local server                | Render Static Site           |
| Backend               | localhost:5000                   | Render Web Service           |
| ML Service            | 127.0.0.1:8000                   | Render Web Service           |
| Database              | Local or remote                  | Remote database              |
| Environment Variables | Local `.env`                     | Render Environment Variables |
| Best Use              | Development and SIH Admin Laptop | Online Demo                  |
| Internet              | Depends on external APIs         | Required                     |

The core application architecture remains the same.

Only the service endpoints and environment configuration change.

---

# Production Security

Before deployment:

* Never commit `.env`
* Rotate previously exposed API keys
* Use strong JWT secrets
* Restrict database access
* Configure CORS for trusted frontend origins
* Validate all user inputs
* Apply request-size limits
* Avoid returning internal stack traces
* Keep credentials in deployment environment variables
* Do not expose private database URLs
* Monitor authentication and API errors
* Use HTTPS in production

---

# Data and AI Design Principles

## 1. Evidence Before AI

```text
Evidence
   |
   v
Computation
   |
   v
Decision
   |
   v
AI Explanation
```

Not:

```text
AI Guess
   |
   v
Business Decision
```

---

# 2. Missing Data Stays Missing

If reliable data is unavailable, the system should not silently convert it into:

```text
0
```

or invent a value.

---

# 3. Confidence is Different from Viability

A business can be:

```text
High viability + low evidence confidence
```

or:

```text
Moderate viability + high evidence confidence
```

These are different concepts and should remain separate.

---

# 4. Competition is Contextual

A competitor count represents identifiable or available market evidence.

It is not automatically a complete census of every business in the area.

---

# 5. Financial Truth is Deterministic

Financial calculations should be performed by the financial engine.

AI should explain the resulting calculations rather than inventing them.

---

# Current SIH 2026 Implementation

The current implementation focuses on delivering a complete core decision-support workflow.

---

# Phase 1 - Real User + Problem + Workflow

## Current Implementation

* Rural and semi-urban entrepreneur use case
* Business feasibility workflow
* Location, business and capital as core inputs
* Decision-oriented output
* User authentication
* User-specific report management

## Next Update

* Expand user journeys
* Add more entrepreneur personas
* Validate workflows through pilot users

---

# Phase 2 - Guided User-Centred Intake

## Current Implementation

* Guided business intake
* Location input
* Business category selection
* Own-capital input
* Validation
* English and Hindi experience

## Next Update

* Adaptive questioning
* More business categories
* Voice-assisted input

---

# Phase 3 - Government Data + Evidence

## Current Implementation

* Government scheme routing
* Scheme rule handling
* Scheme status
* Provisional-rule handling
* Evidence and confidence communication

## Next Update

* Broader official government-scheme coverage
* Automated official-source ingestion
* Application document checklists
* Scheme status monitoring

---

# Phase 4 - Location & Local Market Intelligence

## Current Implementation

* Location-based analysis
* Consumer-base indicators
* Purchasing-power indicators
* Existing business density
* Geographical context
* Local market signals

## Next Update

* More granular village-level datasets
* Seasonal local demand
* Local economic indicators
* Improved geospatial intelligence

---

# Phase 5 - Competition + Ground Reality

## Current Implementation

* Identifiable competitor mapping
* Competition count where available
* Competition classification
* Interactive map
* Evidence and confidence context

## Next Update

* More comprehensive competitor discovery
* Field validation
* Customer-level demand signals
* Competitor pricing intelligence

---

# Phase 6 - Financial + Government Scheme Engine

## Current Implementation

* Project cost
* Own capital
* Financing requirement
* Loan amount
* Interest assumptions
* Tenure
* Repayment planning
* Working-capital planning
* Government scheme routing

## Next Update

* More detailed cash-flow modelling
* Break-even analysis
* Sensitivity analysis
* Scenario simulation
* Bank-ready financial summaries

---

# Phase 7 - Business Viability & Decision Engine

## Current Implementation

* Viability scoring
* Viability classification
* Recommendation
* Financial context
* Competition context
* Repayment context
* Confidence indicators
* Recommendation gating

## Next Update

* More granular decision models
* Alternative business recommendations
* Market-gap analysis
* Entrepreneur-specific recommendations

---

# Future Scope

The following phases represent planned expansion beyond the current SIH 2026 core implementation.

---

# Phase 8 - Market Gaps & Differentiation Engine

Instead of stopping at:

> "The market is saturated."

future versions could identify:

* Underserved customer segments
* Missing products and services
* Local demand gaps
* Competitor weaknesses
* Differentiation opportunities
* Premium versus value positioning
* Service-quality gaps

Possible workflow:

```text
Existing Market
      |
      v
Competitor Analysis
      |
      v
Customer Need Gaps
      |
      v
Differentiation Opportunities
      |
      v
Recommended Positioning
```

---

# Phase 9 - Alternative Business Engine

If the selected business is weak, the platform could recommend alternatives.

Example:

```text
Selected Business
      |
      v
Kirana Store
      |
      v
Score: 42/100

Alternative
      |
      v
Dairy Business
      |
      v
Score: 74/100

Alternative
      |
      v
Food Processing
      |
      v
Score: 69/100
```

The recommendation should explain why an alternative is stronger rather than simply ranking it.

---

# Phase 10 - Trust, Explainability and Human Override

Future versions could introduce stronger human-in-the-loop validation.

Possible workflow:

```text
AI Estimate
    |
    v
Field Validation
    |
    v
Correction
    |
    v
Verified Evidence
    |
    v
Improved Recommendation
```

Administrators or field workers could validate important local information before it influences future recommendations.

---

# Phase 11 - Decision-Centric Flagship Report

The future report experience could evolve into a comprehensive decision document containing:

* Executive summary
* Business feasibility
* Location analysis
* Competition
* Market gaps
* Financial plan
* Government schemes
* Loan structure
* Working capital
* Risks
* Mitigation
* Confidence
* Evidence sources
* Recommended next steps

The goal would be to provide a single decision document instead of requiring users to interpret multiple independent analytics.

---

# Phase 12 - Test Before You Invest

Before making a large investment, the platform could recommend low-cost validation experiments.

Possible workflow:

```text
Business Idea
      |
      v
Customer Interviews
      |
      v
Small Pilot
      |
      v
Demand Test
      |
      v
Feedback
      |
      v
Revise Business Plan
      |
      v
Invest
```

This could reduce the risk of making irreversible investments based only on forecasts.

---

# Phase 13 - Production, Deployment and Pilot Readiness

Future production expansion could include:

* Larger-scale infrastructure
* Advanced monitoring
* Stronger authentication controls
* Role-based administration
* Field-worker workflows
* Human validation
* More extensive official datasets
* Regional language expansion
* Production-grade analytics
* Entrepreneur feedback loops
* Business performance tracking

---

# Additional Future Features

## Scenario Simulator

Allow entrepreneurs to change assumptions interactively.

Examples:

```text
What if own capital increases?

What if loan interest rises?

What if monthly sales are lower?

What if raw-material costs increase?

What if initial equipment investment decreases?
```

The system could immediately show changes in:

* Viability
* Cash requirement
* Repayment
* Break-even
* Risk
* Recommendation

---

# Break-Even Analysis

Future versions could add:

* Break-even units
* Break-even revenue
* Fixed costs
* Variable costs
* Contribution margin
* Margin of safety

---

# Cash-Flow Forecast

Future versions could generate:

* Monthly cash inflow
* Monthly cash outflow
* Working-capital requirement
* Cash deficit periods
* Cash surplus periods
* Loan repayment impact

---

# Seasonal Business Intelligence

Future analysis could incorporate:

* Festival demand
* Agricultural cycles
* Weather
* Tourism
* School calendars
* Harvest periods
* Local events

This could produce month-wise demand expectations.

---

# Customer Persona Builder

Future versions could generate location-specific customer personas using available evidence.

Example:

```text
Primary Customer

Age:
25-45

Location:
Nearby villages

Need:
Affordable daily-use products

Purchase Pattern:
Frequent / low-ticket

Key Decision Factor:
Price + convenience
```

---

# Supplier Intelligence

Future versions could map:

* Local suppliers
* Wholesale markets
* Raw-material sources
* Supplier distance
* Indicative prices
* Transportation cost
* Supplier concentration

This would help entrepreneurs understand both demand and supply.

---

# Logistics and Distance Analysis

Future versions could calculate:

* Distance to supplier
* Distance to market
* Transportation implications
* Delivery radius
* Accessibility

This could be particularly valuable for rural businesses.

---

# Voice-Based Rural Assistant

A future interface could allow users to speak instead of typing.

Example:

> "Mere paas 70,000 rupaye hain aur main apne gaon mein dairy business shuru karna chahta hoon."

Potential components:

* Speech-to-text
* Hindi and Hinglish understanding
* Guided voice questions
* Voice report summary

---

# WhatsApp-Based Business Assistant

A future version could allow entrepreneurs to interact through familiar messaging workflows.

Possible functions:

* Submit business idea
* Receive feasibility summary
* Ask follow-up questions
* Receive scheme information
* Upload documents
* Get reminders
* Receive alerts

---

# Document and Scheme Eligibility Assistant

Users could eventually upload relevant documents such as:

* Business registration documents
* Quotations
* Bank statements
* Land or lease documents
* Existing loan information

The system could help identify missing information and possible scheme requirements.

Sensitive documents should be processed with strict privacy controls.

---

# Government Scheme Discovery Engine

Future versions could continuously ingest official scheme information.

Potential capabilities:

* Scheme discovery
* Eligibility matching
* Benefit comparison
* Application checklist
* Required documents
* Official-source links
* Scheme expiry and status monitoring

---

# Human-in-the-Loop Field Validation

Future versions could allow administrators or field workers to validate important local information.

Possible workflow:

```text
AI Estimate
    |
    v
Field Validation
    |
    v
Correction
    |
    v
Verified Evidence
    |
    v
Improved Recommendation
```

This can be particularly useful for rural pilot programs.

---

# Entrepreneur Feedback Loop

After starting a business, users could provide:

* Actual sales
* Actual costs
* Actual demand
* Loan repayment performance
* Business challenges
* Monthly performance

The system could compare:

```text
Predicted
    vs
Actual
```

and use this feedback to improve future decision-support models.

---

# Business Progress Dashboard

After launch, entrepreneurs could track:

* Revenue
* Costs
* Profit
* Inventory
* Loan outstanding
* Monthly cash flow
* Business milestones

This would eventually turn UdyamSaarthi-AI from a:

> **Pre-investment feasibility tool**

into a:

> **Long-term business companion**

---

# PDF Business Plan Generator

Future versions could generate a structured business-plan document containing:

* Executive summary
* Business concept
* Market context
* Competition
* Financial plan
* Funding requirement
* Scheme options
* Risks
* Mitigation
* Implementation plan

This could be useful when approaching banks, institutions, incubators or government programs.

---

# Bank-Ready Loan Preparation

Future functionality could help users prepare:

* Loan requirement summary
* Repayment estimate
* Project-cost structure
* Supporting assumptions
* Scheme match
* Document checklist

The goal would be to reduce friction between:

```text
Business Idea
      |
      v
Feasibility
      |
      v
Financial Plan
      |
      v
Loan Preparation
```

---

# Regional Language Expansion

Beyond Hindi and English, future versions could support:

* Bengali
* Marathi
* Tamil
* Telugu
* Gujarati
* Kannada
* Malayalam
* Punjabi
* Odia

using the existing translation architecture.

---

# Future Product Vision

The long-term vision is to evolve UdyamSaarthi-AI from a feasibility calculator into an end-to-end entrepreneurship decision platform.

```text
                 IDEA
                   |
                   v
             Feasibility
                   |
                   v
             Market Analysis
                   |
                   v
              Financial Plan
                   |
                   v
            Scheme Matching
                   |
                   v
              Business Setup
                   |
                   v
              Pilot Testing
                   |
                   v
             Business Launch
                   |
                   v
              Performance
                Monitoring
                   |
                   v
              AI Improvement
```

The eventual objective is:

> **Help entrepreneurs move from "I have a business idea" to "I understand the evidence, risks, financial requirements and next steps."**

---

# Why UdyamSaarthi-AI?

## Traditional Approach

```text
Business Idea
      |
      v
Generic Internet Search
      |
      v
Word of Mouth
      |
      v
Investment
      |
      v
Hope
```

## UdyamSaarthi-AI Approach

```text
Business Idea
      |
      v
Location-Specific Evidence
      |
      v
Competition Context
      |
      v
Financial Modelling
      |
      v
Government Scheme Routing
      |
      v
Risk Analysis
      |
      v
Viability Assessment
      |
      v
Explainable Decision Support
      |
      v
Better-Informed Investment
```

---

# Important Disclaimer

UdyamSaarthi-AI is a:

> **Decision-support and feasibility platform, not a guarantee of business success.**

Scores, estimates, pricing and recommendations depend on:

* Data availability
* Data quality
* Location information
* Business assumptions
* Financial assumptions
* Market conditions
* Government scheme rules

Users should independently verify important financial, legal, regulatory and government-scheme information before making investment or borrowing decisions.

---

# Security

Security is an important part of the platform architecture.

The project follows these principles:

* Do not commit `.env` files
* Do not expose API keys
* Do not expose database credentials
* Use strong JWT secrets
* Hash user passwords
* Protect user-specific API routes
* Verify report ownership
* Prevent cross-user report access
* Use HTTPS in production
* Restrict database access
* Configure trusted CORS origins
* Validate user inputs
* Avoid returning internal stack traces

If credentials are accidentally exposed:

1. Revoke or rotate the credentials immediately.
2. Remove the credentials from the source repository if committed.
3. Generate replacement credentials.
4. Update the deployment environment variables.

---

# Contributing

Contributions are welcome.

A typical workflow:

```bash
git checkout -b feature/your-feature
```

Make the required changes and test locally.

Then:

```bash
git add .
git commit -m "Add: your feature"
git push origin feature/your-feature
```

Open a Pull Request with:

* Problem addressed
* Changes made
* Screenshots where relevant
* Testing performed
* Known limitations

---

# Project

**UdyamSaarthi-AI**

### Hyper-Local Business Advisory & Financial Decision-Support Platform for Rural Entrepreneurs

Built with:

**React + Node.js + Python + FastAPI + MongoDB + PostgreSQL + Gemini**

---

# Project Links

| Resource          | Link                                                                                                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub Repository | [https://github.com/AaryanVerma17/UdyamSaarthi-AI](https://github.com/AaryanVerma17/UdyamSaarthi-AI)                                                                                                 |
| Live Application  | [https://udyamsaarthi.onrender.com](https://udyamsaarthi.onrender.com)                                                                                                                               |
| Demo Video        | [https://drive.google.com/file/d/1SRYgfcMLP77qFkJXjmh_vgTFSUlpLlQC/view?usp=sharing](https://drive.google.com/file/d/1SRYgfcMLP77qFkJXjmh_vgTFSUlpLlQC/view?usp=sharing)                             |
| Project PPT       | [https://drive.google.com/file/d/17j9Fa3xadDd8B4djPvrSrwwE_rFIG7qE/view?usp=sharing](https://drive.google.com/file/d/17j9Fa3xadDd8B4djPvrSrwwE_rFIG7qE/view?usp=sharing)                             |
| Documentation     | [https://docs.google.com/document/d/1pjgLozCisl2lvO_ufANM0kiShyEWGxwHQZOiW4iofyg/edit?usp=sharing](https://docs.google.com/document/d/1pjgLozCisl2lvO_ufANM0kiShyEWGxwHQZOiW4iofyg/edit?usp=sharing) |

---

<p align="center">

**UdyamSaarthi-AI**

*Evidence before investment. Intelligence before action.*

</p>
```