# MediRoute — Smart Medicine Supply & Emergency Optimization

> **Hackathon-Ready Healthcare Logistics Platform**  
> Helping regional healthcare administrators identify critical medicine shortages across multiple clinics and orchestrate mathematically safe redistribution of surplus inventory.

---

## Problem Statement
In regional healthcare ecosystems, clinic inventories frequently operate in operational silos:
- Community clinics face acute stockouts of life-saving medicines (e.g. Epinephrine, Naloxone, pediatric antibiotics) due to local surges or delayed central supply chains.
- Concurrently, nearby general hospitals or urgent care facilities often hold surplus reserves, with some batches sitting at risk of expiring unused.
- Traditional manual reallocations are slow, ad-hoc, and risk leaving the donor facility vulnerable if safety thresholds are not strictly enforced.

**MediRoute** solves this with an automated, transparent redistribution network that connects facilities and recommends optimal transfers while strictly preserving every donor clinic's minimum safety-stock reserve.

---

## Core Features & System Capabilities

### 1. Operations Command Dashboard
- High-level KPI monitoring: linked facilities (5), monitored medicines (12), critical shortages ($\le 2.5$ days runway), low-stock alerts, confirmed demo transfers, and projected stockouts averted.
- **Visual Network Health Charts**:
  - Regional clinic status comparison (stacked bar chart showing Optimal, Surplus, Low Stock, and Critical batches per facility).
  - Donut chart breakdown of network-wide stock balance.
- **Urgent Action Feed**: Prioritized shortage alerts with fully functional **"Match Donor"** inspection buttons.
- **Reproducible Guided Walkthrough Banner**: Instant 1-click launcher demonstrating algorithm selecting a safe donor while refusing an unsafe alternative.
- **Live Transfer Activity Feed**: Real-time manifest of ongoing and completed medicine dispatches.

### 2. Multi-Clinic Inventory Ledger
- Realistic synthetic inventory across **5 distinct facilities** and **12 critical pharmaceutical agents** (60 total batch records).
- Real-time calculations:
  - **Current On-Hand Stock** vs **Minimum Safety Stock**.
  - **Daily Consumption Rate (Burn Rate)**.
  - **Days Until Stockout** (`currentStock / avgDailyConsumption`).
  - **Batch Lot Codes & Expiration Dates** with days-to-expiry countdown.
- Full text search, multi-factor filtering (by clinic, therapeutic category, and stock status), and multi-column sorting.
- **Add & Edit Modals**: Full validation with live recalculation preview before saving changes to `localStorage`.
- **Match Donor Button on Every Shortage Row**: Open the recommendation modal directly from the inventory table.

### 3. Shortage Forecasting & Explainable Runway
- Interactive 14-day and 21-day stock projection area charts using Recharts.
- **Explainable Consumption Model**:
  - Clear formula transparency: $\text{Current Stock} \div \text{Daily Burn Rate} = \text{Days of Supply}$.
  - Day-of-week clinical load variance modeling ($1.10\times$ weekday factor, $0.75\times$ weekend factor).
  - Confidence bands ($\pm 15\%$ variance) representing real-world clinical intake volatility.
- **Cross-Clinic Runway Matrix**: Side-by-side days-of-supply balance comparison across all 5 facilities for any selected medicine.

### 4. Deterministic Smart Redistribution Engine
- **Algorithmic Candidate Evaluation**: Evaluates all network facilities holding the requested medicine formulation.
- **Mathematical Donor Safety Invariant**:
  $$\text{donor.postTransferStock} \ge \text{donor.minSafetyStock}$$
  *The algorithm never recommends or executes transfers that would leave a donor clinic below its designated safety reserve.*
- **Rigorous Rejection Constraints**:
  - Expired batches ($\text{daysToExpiry} \le 0$) are strictly blocked.
  - Short shelf-life batches ($\text{shelf life} < 48\text{h}$ or less than courier transit duration) are strictly blocked.
  - Incompatible formulations or facilities with insufficient surplus are rejected with explicit rationale.
- **Atomic Application-Level Updates**: Prevents duplicate execution, prevents negative stock, and mutates both donor and recipient inventories in a single atomic transaction.
- **Interactive Match Donor Panel**:
  - Displays donor surplus, recipient need, before/after safety reserves, road distance, courier transit time, batch expiry, and plain-language explanation.
  - Displays **"Candidate Facilities Refused by Constraint Engine"** with specific rejection reasons.

### 5. Interactive Emergency Surge & Mass Casualty Sandbox
- **Custom Shortage Simulator**: Allows users to select any clinic, any essential medicine, and intake surge factor ($2.5\times$ to $6.0\times$) to simulate an acute shortage on demand.
- **Preset Crisis Scenarios**:
  - *Mass Casualty Collision at Metro Hope General*: Depletes IV analgesics, clotting agents, and resuscitation fluids.
  - *Severe Pediatric Respiratory Outbreak at Riverdale*: Surges demand for Amoxicillin, Salbutamol inhalers, and Ceftriaxone.
  - *Fentanyl Overdose Cluster near St. Jude*: Acute demand spike for Naloxone HCl and Epinephrine.
- **Expedited Dispatch Mode**: Prioritizes life-support medications with simulated blue-light courier transit (~35% faster).
- **Direct Confirmation & Rejection**: Users can review, confirm, or reject proposed emergency transfers directly within Emergency Mode.
- **Simulation Transparency**: Prominently labeled as synthetic scenarios with no live 911/EMS integration.

### 6. Impact Analytics & Verifiable Audit Ledger
- Metrics cleanly distinguished:
  - **Confirmed Demo Transfers**: Physical units moved, executed transfers count, and wholesale value reallocated.
  - **Projected Benefits**: Labeled as *Estimated Model Projections*, never claimed as verified real-world outcomes.
- **Verifiable Audit Table**: Full timestamped ledger with batch numbers, transit distances, and recipient notes.
- **CSV Manifest Export**: Download a timestamped `.csv` file containing the complete audit trail of transfers.

---

## Network Data Architecture

### Monitored Facilities
1. **Metro Hope General Hospital (`MHG`)**: Regional Level-1 trauma center (380 beds).
2. **St. Jude Community Health Center (`SJC`)**: Urban community health center (65 beds).
3. **Riverdale Pediatric & Maternal Clinic (`RPC`)**: Specialized pediatric clinic (45 beds).
4. **Northside Urgent Care Center (`NUC`)**: High-throughput urgent care (30 beds).
5. **Pinecrest Family Medical Post (`PFM`)**: Rural community outpost (20 beds).

### Monitored Pharmaceutical Categories
- **Antibiotics**: Amoxicillin 500mg, Ceftriaxone 1g IV/IM
- **Emergency & Resuscitation**: Epinephrine 1mg/mL Auto-Injector, Dextrose 50% Injection, Naloxone HCl 0.4mg/mL
- **Endocrine & Metabolic**: Insulin Glargine 100 U/mL (Refrigerated), Metformin HCl 500mg
- **Respiratory**: Salbutamol HFA Inhaler 100mcg
- **Cardiovascular**: Atorvastatin 20mg, Heparin Sodium 5,000 USP Units/mL
- **Analgesics & Pain**: Paracetamol IV 10mg/mL Infusion
- **Critical Care & Fluids**: Ondansetron 4mg/2mL

---

## Technology Stack
- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (custom healthcare navy, crisp slate, clinical teal, and emergency rose palette)
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **Persistence**: Reactive `localStorage` with initial synthetic seed & one-click reset
- **Unit Testing**: Vitest

---

## Getting Started

### Prerequisites
- Node.js (v18 or later recommended)
- npm or yarn

### Installation
```bash
# Clone or navigate to the repository
cd "health hackathon"

# Install dependencies
npm install
```

### Running the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### Running Unit Tests
```bash
npm test
```
Runs the Vitest test suite covering:
1. **Safety-reserve preservation**: Donor post-transfer stock strictly $\ge$ donor safety reserve.
2. **Insufficient donor stock**: Rejection when donor has zero surplus or stock $\le$ safety stock.
3. **Expiry constraints**: Rejection of expired batches and batches with insufficient shelf life ($< 48\text{h}$ or less than transit duration).
4. **Recipient demand calculation**: Transfers bringing recipient to safety threshold without exceeding capacity limits.
5. **Reproducible demo scenario**: Selecting valid donor with safe surplus and refusing unsafe alternatives.
6. **Duplicate transfer prevention**: Guarding against duplicate execution and ensuring idempotency.
7. **Shortage calculations**: Days until stockout, fractional rounding, zero consumption handling, and 14-day projections.

### Building for Production
```bash
npm run build
```
Creates an optimized production bundle in `dist/`.

---

## Ethical & Regulatory Disclaimer
*MediRoute is a hackathon demonstration prototype operating on synthetic clinical data. It does not interface with municipal Computer-Aided Dispatch (CAD) or emergency services (911/999/112). All projected impact metrics represent estimated algorithmic simulation results and are not verified clinical accounting.*
