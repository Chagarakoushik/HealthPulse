# 🏥 HealthPulse EHR — Health Records Management System

> **AI Growth Python Skills Assessment Project**  
> A complete, modern, production-grade Electronic Health Records (EHR) management system with **automated clinical health remarks powered by Groq's official Python SDK**, persistent storage via **MongoDB**, a fast **Python FastAPI** backend, and a responsive **React + Vite + Tailwind CSS** clinical dashboard.

---

## 🌟 Key Features

1. **Full CRUD Patient Record Management:**
   - **Create:** Register patient with validation and automated Groq AI health remarks synthesis.
   - **Read:** Live clinical patient table with risk indicators, biomarker gauges, search, and sorting.
   - **Update:** Real-time editable vitals with automatic AI remark re-evaluation if blood values change.
   - **Delete:** Safe deletion with confirmation modal.
2. **Clinical Biomarkers & Reference Standards:**
   - **Fasting Blood Glucose (mg/dL):** Hypoglycemia (<70), Optimal (70–99), Prediabetes (100–125), Diabetic threshold (≥126).
   - **Haemoglobin (g/dL):** Anemia indicator (<12.0), Normal (12.0–17.5), Polycythemia (>17.5).
   - **Total Cholesterol (mg/dL):** Desirable (<200), Borderline High (200–239), High (≥240).
3. **Groq AI Integration:**
   - Uses the official `groq` Python SDK (`llama-3.3-70b-versatile`).
   - Analyzes patient biomarkers and synthesizes structured medical impressions, dietary guidelines, and clinical follow-up advice.
   - **Graceful Fallback:** If `GROQ_API_KEY` is not provided or API is offline, an intelligent clinical rule engine automatically generates accurate remarks so the app never fails.
   - **Regenerate Remarks:** One-click re-analysis button on any patient record.
4. **Strict Medical & Data Validations:**
   - Email format validation with duplicate prevention (HTTP 409 Conflict).
   - Date of Birth validation ensuring no future dates and realistic human age.
   - Physiologically bounded positive numeric values for glucose, haemoglobin, and cholesterol.
5. **Preloaded 10 Patient Assessment Records:**
   - 10 Indian patient records covering diverse clinical cases (Normal, Prediabetic, Type 2 Diabetic, Anemic, Polycythemic, Hypercholesterolemic, Hypoglycemic).
   - Single-click **"Reset Assessment Data"** button to restore the 10 assessment test records anytime.
6. **MongoDB Persistence with Resilient Fallback:**
   - Connects to local MongoDB or MongoDB Atlas via `MONGODB_URI`.
   - Auto-detects database connectivity; includes an embedded async persistent store so the application works out of the box even if a local MongoDB service is not started.

---

## 🏗️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19 + Vite | Fast HMR, component-driven UI |
| **Styling** | Tailwind CSS v3 | Curated medical color palette, glassmorphism, responsive |
| **Icons** | Lucide React | Medical & operational iconography |
| **HTTP Client** | Axios | Configured with timeout and interceptor error handling |
| **Backend** | Python FastAPI | High-performance asynchronous REST API |
| **Data Validation** | Pydantic v2 | Strict data schemas, field validators, custom HTTP 422 handlers |
| **Database** | MongoDB (Motor & PyMongo) | Asynchronous MongoDB driver with unique indexes |
| **AI LLM** | Groq Python SDK | Ultra-fast inference (`llama-3.3-70b-versatile`) |

---

## 📁 Project Directory Structure

```text
HealthRecordManagement/
├── backend/
│   ├── data/                   # Local persistent store fallback
│   ├── routes/
│   │   └── patients.py         # REST API endpoints (CRUD, stats, seed, remarks)
│   ├── services/
│   │   └── ai_service.py       # Official Groq Python SDK & rule fallback engine
│   ├── config.py               # Environment configuration (.env loader)
│   ├── database.py             # Motor MongoDB client & resilient storage manager
│   ├── main.py                 # FastAPI application, CORS, lifespan auto-seed
│   ├── models.py               # Pydantic validation models & clinical categories
│   ├── seed_data.py            # Exact 10 assessment patient test records (Indian names)
│   ├── requirements.txt        # Backend dependencies
│   ├── .env                    # Environment variables (Groq Key, MongoDB URI)
│   └── .env.example            # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Header with live system status badges
│   │   │   ├── StatsCards.jsx           # Cohort stats & biomarker averages
│   │   │   ├── PatientTable.jsx         # Searchable, filterable patient table
│   │   │   ├── PatientModal.jsx         # Add/Edit form with live input validation
│   │   │   ├── PatientDetailModal.jsx   # Detailed report & Groq AI remarks viewer
│   │   │   ├── DeleteConfirmationModal.jsx # Safe deletion confirmation
│   │   │   └── Toast.jsx                # Alert notification banner
│   │   ├── services/
│   │   │   └── api.js                   # Axios HTTP client
│   │   ├── App.jsx                      # Main dashboard controller & state
│   │   ├── index.css                    # Tailwind CSS & custom design system
│   │   └── main.jsx                     # React entrypoint
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── tests/
│   └── test_api.py             # Pytest automated test suite (7 tests)
└── README.md                   # Documentation & Viva guide
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (Python 3.12 recommended)
- **Node.js 18+** & npm
- (Optional) **MongoDB** (local `mongod` or free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- (Optional) **Groq API Key** from [console.groq.com/keys](https://console.groq.com/keys)

---

### Step 1: Backend Setup & Run

1. Open a terminal in the project root:
   ```bash
   cd "e:\ALL PROJECTS\HealthRecordManagement"
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Configure environment variables in `backend/.env`:
   ```ini
   # MongoDB Connection URI (Local or MongoDB Atlas)
   MONGODB_URI=mongodb://localhost:27017
   DATABASE_NAME=health_records_db

   # Groq API Key (Get free key at https://console.groq.com/keys)
   GROQ_API_KEY=gsk_your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile

   # Server Config
   HOST=127.0.0.1
   PORT=8000
   ```
   *(Note: If you leave `GROQ_API_KEY` blank, the app will run with the clinical rule fallback engine without any errors!)*

5. Start the FastAPI backend server:
   ```bash
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```

   - API Server: `http://127.0.0.1:8000`
   - Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`
   - System Health Check: `http://127.0.0.1:8000/api/health`

---

### Step 2: Frontend Setup & Run

1. Open a **new terminal** and navigate to `frontend`:
   ```bash
   cd "e:\ALL PROJECTS\HealthRecordManagement\frontend"
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```text
   http://127.0.0.1:5173/
   ```

---

## 🧪 Running Automated Tests

To run the automated test suite verifying CRUD operations, Pydantic validations, duplicate email conflicts, and health endpoints:

```bash
.\venv\Scripts\python.exe -m pytest tests/test_api.py -v
```

**Results (7/7 Passed):**
- `test_health_endpoint` ✅ PASSED (Verifies system status, DB & Groq readiness)
- `test_seed_and_list_patients` ✅ PASSED (Verifies seeding and retrieval)
- `test_validation_future_dob` ✅ PASSED (Prevents future birth dates)
- `test_validation_invalid_email` ✅ PASSED (Ensures strict RFC-compliant email)
- `test_validation_negative_blood_metrics` ✅ PASSED (Rejects zero/negative numbers)
- `test_duplicate_email_conflict` ✅ PASSED (Returns HTTP 409 Conflict)
- `test_crud_lifecycle` ✅ PASSED (Create -> Read -> Update -> Delete -> 404 verify)

---

## 👥 Assessment Test Records (Indian Names)

The application includes 10 standardized clinical test profiles:

| # | Patient Name | Email | DOB (Age) | Glucose (mg/dL) | Haemoglobin (g/dL) | Cholesterol (mg/dL) | Clinical Classification |
|---|---|---|---|---|---|---|---|
| 1 | **Aarav Sharma** | `aarav.sharma@example.com` | 1985-04-12 (41) | 88.0 | 14.5 | 175.0 | **Normal** (Optimal Vitals) |
| 2 | **Priya Patel** | `priya.patel@example.com` | 1990-08-23 (36) | 115.0 | 13.8 | 190.0 | **Moderate Risk** (Prediabetes) |
| 3 | **Rajesh Kumar** | `rajesh.kumar@example.com` | 1972-11-05 (54) | 165.0 | 14.2 | 245.0 | **High Risk** (Diabetes + High Chol.) |
| 4 | **Ananya Iyer** | `ananya.iyer@example.com` | 1995-02-17 (31) | 92.0 | 9.8 | 160.0 | **High Risk** (Iron Deficiency Anemia) |
| 5 | **Vikram Malhotra** | `vikram.malhotra@example.com` | 1988-06-30 (38) | 98.0 | 15.1 | 225.0 | **Moderate Risk** (Borderline Chol.) |
| 6 | **Sneha Reddy** | `sneha.reddy@example.com` | 1982-09-14 (44) | 94.0 | 18.2 | 185.0 | **Moderate Risk** (Elevated Hb) |
| 7 | **Ramesh Verma** | `ramesh.verma@example.com` | 1965-03-29 (61) | 142.0 | 13.0 | 255.0 | **High Risk** (Metabolic Syndrome) |
| 8 | **Divya Joshi** | `divya.joshi@example.com` | 1998-12-08 (28) | 62.0 | 12.4 | 170.0 | **Moderate Risk** (Hypoglycemia) |
| 9 | **Rohan Mehta** | `rohan.mehta@example.com` | 1978-07-21 (48) | 96.0 | 15.8 | 260.0 | **High Risk** (High Cholesterol) |
| 10 | **Kavya Nair** | `kavya.nair@example.com` | 2000-01-15 (26) | 84.0 | 13.5 | 165.0 | **Normal** (Balanced Athlete Vitals) |

*You can reset or restore these records anytime in the UI using the **"Reset Assessment Data"** button.*

---

## 🎓 Viva / Assessment Explanation Guide

When presenting this project in your assessment, highlight these key design decisions:

### 1. Why FastAPI and Pydantic?
- **Pydantic Models (`backend/models.py`):** Enforces data integrity before data reaches the database. If a user inputs a future date of birth, an invalid email, or a negative blood value, Pydantic catches it immediately and FastAPI returns an HTTP 422 Unprocessable Content with exact error messages.
- **Asynchronous Execution:** FastAPI leverages Python's `async/await` and ASGI (`uvicorn`) for concurrent handling of database and AI calls without thread blocking.

### 2. How Groq AI Integration Works (`backend/services/ai_service.py`):
- Uses the official `groq` Python SDK (`from groq import Groq`).
- Passes clinical prompts with standard medical reference ranges to `llama-3.3-70b-versatile` with low temperature (`0.2`) for factual consistency.
- **Fault-Tolerant Architecture:** If the user hasn't set `GROQ_API_KEY`, or if internet drops, the system automatically falls back to an internal deterministic clinical rule engine so the application remains 100% functional.

### 3. Duplicate Handling & Status Codes:
- **HTTP 201 Created:** For successful patient registration.
- **HTTP 409 Conflict:** When attempting to register a patient with an email that is already in use.
- **HTTP 404 Not Found:** When an ID does not exist.
- **HTTP 422 Unprocessable Content:** When payload validation fails.

### 4. Database Resilience (`backend/database.py`):
- Built with Motor (`AsyncIOMotorClient`) for production MongoDB.
- Includes an auto-fallback to an asynchronous persistent JSON store (`backend/data/patients_store.json`), meaning an evaluator can evaluate the application immediately even if MongoDB isn't running on their machine!

---

## 📄 License
Created for AI Growth Python Skills Assessment &bull; Developed by Chagara Koushik.
