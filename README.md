# BharatGov AI: AI-Powered Cross-Ministry Governance & Impact Intelligence Platform

> **Hackathon Track**: Problem ID **EL-03**  
> **Challenge**: Cross-Ministry Governance & Impact Intelligence Platform  
> **Tech Stack**: React 18, Tailwind CSS, Leaflet.js, Chart.js, Python Flask, Pandas, NumPy

---

## 🌟 Executive Overview
Government programmes in India cut across multiple Union Ministries, departments, and geographic tiers. Traditional governance systems suffer from data fragmentation—schemes are reported in vertical silos, making it almost impossible to:
1. Detect where central funds are flowing versus where genuine local socio-economic deprivation exists (**Invested vs. Under-Invested Gaps**).
2. Spot parallel or duplicative programmes operating in the same district targeting identical beneficiary segments (**Scheme Redundancies**).
3. Catch implementation lags, capital leakage, and sanctioned budget overruns before deadlines lapse (**Execution Anomalies**).
4. Query cross-programme intelligence using natural language.

**BharatGov AI** unifies and harmonizes multi-source government data into a unified impact intelligence layer, providing Union and State decision-makers with geospatial visualizations, an AI-powered conversational query engine, and traceable, evidence-backed policy directives.

---

## 📂 Harmonization of 3 Heterogeneous Datasets

In strict compliance with the hackathon deliverables (*"Demonstrate ingestion and harmonization of at least 2–3 heterogeneous government datasets"*), our platform automatically unifies:

| # | Dataset | Source Level | Key Entities Resolved |
|---|---|---|---|
| **1** | **Project Implementation & Expenditure** (`data/projects_data.csv`) | Execution Level | 60 projects across 5 Union Ministries, 13 States, district coordinates, budgets, actual spend, completion %, beneficiaries, and timelines. |
| **2** | **District Socioeconomic & Deprivation Index** (`data/district_demographics.csv`) | Demographic / Vulnerability | Population, Poverty Headcount %, Child Malnutrition %, Agricultural Workforce %, Healthcare Facility Deficit %, and NITI Aayog-style Composite Need Index (0-100). |
| **3** | **Union Ministry Sanctioned Outlays & Mandates** (`data/ministry_schemes.csv`) | Policy / Macro Allocation | Central budgetary outlays, sector targets, SDG alignment (SDG 1, 2, 3, 4, 5, 8, 9, 11), and target beneficiary classifications. |

---

## 🧠 Core Intelligence Engines

### 1. Investment Gap & Need Disparity Engine
- Quantifies the divergence between district vulnerability and per-capita central disbursements:
  $$\text{Disparity Gap} = Z_{\text{Need}} - Z_{\text{Per Capita Spend}}$$
- Classifies districts into 5 tiers:
  - 🔴 **Critically Under-Invested** (e.g. Bhubaneswar, Patna, Lucknow)
  - 🟡 **Moderate Deficit**
  - 🔵 **Balanced Allocation**
  - 🟣 **Well Funded**
  - 🟢 **Saturated / High Spend**
- Dissects sector-specific deficits (e.g., Child malnutrition >35% with low nutrition outlay; healthcare facility deficit >30% with limited clinical funding).

### 2. Cross-Ministry Scheme Overlap & Synergies Detector
- Identifies multi-ministry convergence opportunities in identical geographic territories:
  - **Child & Maternal Nutrition Convergence**: Ministry of Education (*Mid-Day Meal / PM POSHAN*) vs. Ministry of Women & Child Development (*Poshan Abhiyaan* and *ICDS*).
  - **Rural Civil Infrastructure Synergy**: Ministry of Rural Development (*MGNREGA* + *PMGSY* + *PMAY-G*).
  - **Women Socioeconomic Empowerment**: Ministry of Rural Development (*NRLM Self Help Groups*) vs. Ministry of Women & Child Development (*Beti Bachao Beti Padhao*).

### 3. Expenditure & Milestone Anomaly Radar
- Automatically detects and flags high-risk governance anomalies:
  - **Severe Delays with Capital Depletion**: Projects flagged as "Delayed" despite >70% or >100% budget spent (e.g. `PRJ-HEALTH-037` Mobile Health Clinics in Patna).
  - **Sanctioned Budget Overrun**: Actual spend exceeding sanctioned capital (e.g. `PRJ-RD-015` in Bhopal, `PRJ-HEALTH-037` in Patna).
  - **Fund-to-Milestone Decoupling**: High fund absorption with negligible physical progress.
  - **Sluggish Implementation Velocity**: Low fund absorption nearing project completion dates.

### 4. Natural Language Governance Copilot
- Interprets plain English queries from ministers, auditors, and policy planners.
- Sample queries supported out-of-the-box:
  - *"Which districts have high malnutrition but low nutrition spend?"*
  - *"Show delayed projects with high spend"*
  - *"Find scheme overlaps in Pune"*
  - *"Compare Ministry of Agriculture and Rural Development"*
  - *"Audit governance profile of Patna"*
  - *"Show projects with sanctioned budget overrun"*

### 5. Traceable Policy Directives & Direct Data Grounding
- Every AI policy brief provides a clear evidence trail:
  - Exact target district and deprivation metrics.
  - Specific source project IDs and spend figures.
  - Benchmarked comparison districts.

---

## 🚀 How to Run the Platform

### Option 1: One-Click Windows Launcher
Double-click `run.bat` in the project root folder. It starts the server and opens `http://127.0.0.1:5000` in your default browser.

### Option 2: Command Line
```powershell
# Navigate to the project directory
cd c:\Users\Siddharth\OneDrive\Desktop\Siddharth.S\Projects\gov-intelligence-platform

# Launch the server.
py app.py
```
Open **`http://127.0.0.1:5000`** in your browser.

---

## 📡 REST API Specifications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/summary` | Global KPIs (sanctioned budget, spent, utilization %, beneficiaries, anomaly counts). |
| `GET` | `/api/districts` | 13 districts with geographic coordinates, need scores, and per-capita spend. |
| `GET` | `/api/ministries` | Ministry portfolios, schemes, outlays, and execution progress. |
| `GET` | `/api/projects` | Filterable project list (`?ministry=...&category=...&status=...&search=...`). |
| `GET` | `/api/analytics/gaps` | Ranked investment vs. need disparity scores. |
| `GET` | `/api/analytics/overlaps`| Multi-ministry scheme redundancies and convergence blueprints. |
| `GET` | `/api/analytics/anomalies`| High-risk project execution and expenditure flags. |
| `GET` | `/api/recommendations` | Traceable policy directives with underlying data citations. |
| `POST` | `/api/query` | Natural language governance query processor. |

---

## 🏆 Hackathon Deliverables Checklist (EL-03)
- [x] Ingestion and harmonization of 3 heterogeneous datasets.
- [x] Resolution of common entities (schemes, locations, ministries, beneficiaries).
- [x] Cross-ministry intelligence layer (overlaps, coverage, fund utilization).
- [x] Interactive Geospatial Map of India (Leaflet GIS).
- [x] AI Governance Copilot with Natural Language Querying.
- [x] Evidence-backed traceable recommendations with underlying data points.
