# CareFlow — Quarantine Operations

> **Technical Product Manager (TPM) Assessment Prototype**  
> An enterprise healthcare SaaS application designed to coordinate inpatient monitoring, clinical rounds, discharge clearances, and treatment outcomes across a 74-bed quarantine facility.

---

## 1. Executive Summary & Operational Context

CareFlow is built to address critical operational bottlenecks in inpatient quarantine management:
- **Capacity Management**: 74 total beds initially at **100% capacity (74/74)**.
- **Workflow Interdependence**: Every admitted patient must receive a daily morning temperature measurement followed by daily physician clinical rounds.
- **Root-Cause Bottlenecks Resolved**:
  - *Visits before Vitals*: Doctors visiting patients before vitals are logged, causing clinical inefficiency. CareFlow enforces temperature logging as a prerequisite for routine visits.
  - *Duplicate & Missing Readings*: Accidental overwriting or duplicate measurements. CareFlow implements a duplicate-reading guard requiring justification and confirmation, preserving all historical records.
  - *Discharge Delays*: Patients remaining hospitalized longer than necessary due to delayed clearance. CareFlow provides deterministic eligibility tracking based on **3 consecutive afebrile days (< 38.0°C)**.
  - *Outcomes Compliance*: Dedicated tracking of completed cases against clinical standards: **15% maximum mortality benchmark** and **85% minimum treatment success benchmark**.

---

## 2. Key Product Modules

### 1. Operations Command Center (Overview Dashboard)
- **8 Core Real-Time KPIs**:
  - **Bed Occupancy**: Tracks active patients against capacity (`74/74`, dynamically updates upon discharge or admission).
  - **Temps Done / Pending Today**: Real-time shift vitals progress tracking.
  - **Visits Done / Pending Today**: Doctor rounds coverage count and queue depth.
  - **Awaiting Discharge**: Disaggregated by Doctor Review and Admin Bed Release queues.
  - **Mortality Rate**: `16.0%` (4 deaths / 25 closed cases) with prominent benchmark breach badge.
  - **Treatment Success**: `84.0%` (21 cures / 25 closed cases) with benchmark breach warning.
- **Visual Progress Bars**: Daily temperature monitoring and clinical rounds completion rates.
- **Prioritized Action Required Panel**: Live alerts for visits blocked by missing vitals, febrile patients ($\ge 38.0^\circ\text{C}$), and approved discharges ready for administrative checkout.
- **Audit Feed**: Chronological operational activity log tracking every vital entry, clinical sign-off, admission, and bed release.

### 2. Patient Directory
- **Search & Filters**: Instant multi-parameter search (Name, ID `CF-1001`, or Bed `Bed 01`), ward filters (`Ward A: 1–25`, `Ward B: 26–50`, `Ward C: 51–74`), and workflow status tabs.
- **Optimized Inpatient View**: Built with a dedicated internal scrollable container (`max-h-[640px] overflow-y-auto`) and a `sticky` table header, enabling seamless scanning through all 74 beds without full-page scrolling.
- **Patient Chart Drawer**: Detailed clinical drawer displaying full temperature timelines, physician assessment logs, fever streak calculations, and role-permitted actions.
- **Capacity Guard & Intake**: Ordinary admission is blocked at $74/74$ full occupancy. Directs intake to the integrated **Waiting List Queue**.

### 3. Nurse Monitoring
- Task-focused queue answering: *“Which patients still need their daily temperature recorded?”*
- **Record Temperature Dialog**:
  - Celsius and Fahrenheit input with instant conversion.
  - Physiological bounds validation ($34.0^\circ\text{C} - 43.0^\circ\text{C}$).
  - **Duplicate Reading Warning**: Alerts user when a valid reading already exists today, displays previous measurement details, and requires justification to record a distinct repeat reading without overwriting earlier measurements.

### 4. Doctor Rounds
- Queue prioritizes patients whose morning temperature is logged and doctor visit is pending.
- **Workflow Prerequisite Check**: Routine visit completion is blocked if today's vitals are missing, directing the user toward vitals recording first.
- **Clinical Exception Workflow**: Physicians can conduct an emergency exception visit before vitals are logged by providing a mandatory clinical justification that is permanently audited.
- **Clinical Progress Notes**: Structured note entry and one-click clinical discharge sign-off for qualifying patients.

### 5. Discharge Management
- **5-Stage Deterministic Discharge Protocol**:
  1. *Not eligible*
  2. *Eligible for clinical review* (satisfies 3 consecutive afebrile days strictly $< 38.0^\circ\text{C}$; missing historical days terminate streak).
  3. *Approved by doctor* (physician validates clinical clearance).
  4. *Awaiting administrative discharge* (queued for Bed Manager/Admin).
  5. *Discharged* (Admin executes discharge, releases the bed, and decrements occupancy from $74 \rightarrow 73$).
- **Evidence Verification Panel**: Displays the 3 individual daily temperature readings justifying eligibility.
- **Configurable Demo Threshold**: Configurable between $37.8^\circ\text{C}$ and $38.2^\circ\text{C}$ (default $38.0^\circ\text{C}$) with explicit demo assumption disclosure.

### 6. Outcomes & Quality Monitoring
- **Closed Cohort Analysis**: Evaluates 25 completed historical cases:
  - **4 Deaths / 25 Cases = 16.0% Mortality** (Target $\le 15.0\%$, **+1.0% Breach**).
  - **21 Recovered / 25 Cases = 84.0% Success** (Target $\ge 85.0\%$, **-1.0% Breach**).
- **Metric Integrity**: Active quarantine inpatients ($74$ beds) are strictly isolated from closed outcome records.
- Complete audit table of all 25 cohort cases with admission date, outcome date, duration of stay, and clinical autopsy/discharge notes.

---

## 3. Staff Role Simulation

The application features a demo staff role switcher in the top navigation bar:

| Role | Permissions & Capabilities | Enforced Restrictions |
| :--- | :--- | :--- |
| **Nurse** | Record and review daily temperatures, log repeat readings. | Cannot sign off doctor rounds, approve clinical discharge, or execute admin discharge. |
| **Doctor** | Review patient charts, complete clinical visits, document clinical exceptions, approve 3-day afebrile discharge eligibility. | Cannot perform final administrative bed release. |
| **Admin** | Register patients, admit from waiting list, manage beds, complete final administrative discharge to release beds. | Cannot independently approve clinical discharge eligibility. |

---

## 4. Technology Stack & Design System

- **Framework**: Next.js 15 (App Router)
- **Library**: React 19, TypeScript
- **Styling**: Tailwind CSS
  - **Navy**: `#14263D` (sidebar and primary structural chrome)
  - **Teal**: `#0F9F91` (primary action states, focus rings, and positive indicators)
  - **Surfaces**: `#F5F7FA` soft background with `#FFFFFF` cards and `#E2E8F0` borders
  - **Semantic Accents**: Emerald (`#10B981`) for completed vitals, Amber (`#F59E0B`) for warnings, Rose (`#EF4444`) for fever and benchmark breaches
- **Icons**: Lucide React
- **Persistence**: Safe `localStorage` hydration preventing SSR mismatch errors. Includes a one-click **Reset Demo Data** action to restore the initial $74/74$ baseline.

---

## 5. Acceptance Test Matrix (Tests A – L)

| Test ID | Requirement | Verified Behavior | Status |
| :--- | :--- | :--- | :---: |
| **TEST A** | **Temperature Recording** | Reading appears in chart, updates nurse queue, changes counters, and persists in localStorage. | **PASS** |
| **TEST B** | **Duplicate Reading** | Detects existing reading, displays prior staff/value, enforces confirmation, and prevents silent overwrite. | **PASS** |
| **TEST C** | **Doctor Visit** | Completes visit after valid vitals exist; updates queue and daily completion counters. | **PASS** |
| **TEST D** | **Missing Temperature** | Routine doctor visit is blocked when today's vitals are missing; directs user to vitals recording. | **PASS** |
| **TEST E** | **Discharge Workflow** | Doctor approves 3-day afebrile patient; Admin finalizes discharge; occupancy drops $74/74 \rightarrow 73/74$. | **PASS** |
| **TEST F** | **Missing Historical Data** | Missing days never count as afebrile; missing historical reading prevents qualifying streak. | **PASS** |
| **TEST G** | **Capacity & Waiting List** | Ordinary admission blocked at $74/74$; offers waiting-list intake route once bed is freed. | **PASS** |
| **TEST H** | **Outcomes & Benchmarks** | $4/25 = 16\%$ mortality and $21/25 = 84\%$ success correctly calculated; both benchmark breaches flagged. | **PASS** |
| **TEST I** | **Permissions & Roles** | Role switcher (Nurse, Doctor, Admin) blocks unauthorized actions with explanatory toasts. | **PASS** |
| **TEST J** | **Responsive Design** | Tested and verified across $320\times568$, $375\times812$, $768\times1024$, $1280\times800$, and $2560\times1080$. | **PASS** |
| **TEST K** | **Persistence & Reset** | State persists across refreshes; "Reset Demo Data" restores $74/74$ occupancy and baseline queues. | **PASS** |
| **TEST L** | **Build & Start** | `npm run build` succeeds with zero errors; application serves `200 OK` on `localhost:3000`. | **PASS** |

---

## 6. Getting Started Locally

### Prerequisites
- Node.js `v18.18+` or `v20+` or `v22+`
- npm `v9+` or `v10+` or `v11+`

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
# Verify production build and compilation
npm run build

# Start production server
npm run start
```

---

## 7. Deployment (Vercel)

CareFlow is built as a standard Next.js App Router application and is ready for Vercel deployment:

### Option 1: Git Integration (Recommended)
1. Push this repository to GitHub, GitLab, or Bitbucket:
   ```bash
   git remote add origin <YOUR_REMOTE_URL>
   git branch -M main
   git push -u origin main
   ```
2. Log into the [Vercel Dashboard](https://vercel.com/new), select **Import Project**, and click **Deploy**. Vercel will automatically detect Next.js with zero additional configuration required.

### Option 2: Vercel CLI
```bash
npx vercel login
npx vercel --prod
```
