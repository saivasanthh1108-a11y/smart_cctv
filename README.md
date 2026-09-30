# AegisCorridor - AI Emergency Green Corridor & Traffic Management Dashboard

Real-time React + Vite + Tailwind CSS dashboard communicating with a FastAPI backend at `http://localhost:8000`.

## Features
- **Leaflet Map**:
  - 5 interactive junction markers (J1 to J5) that turn green with radar pulse during an active corridor or police override.
  - Moving ambulance marker animating smoothly along waypoints from origin to hospital.
  - Destination hospital marker with live ER readiness popups.
- **Incident Dispatch Panel**:
  - Emergency scenario presets (STEMI, Highway Collision, Pediatric).
  - Prominent **"Confirm & Dispatch"** button that synchronizes the corridor and dispatches the unit.
- **Hospital Alert Panel**:
  - Severity level indicator (CODE RED).
  - Dynamic ETA countdown synchronized with ambulance progress.
  - Real-time in-transit patient vitals telemetry (Heart Rate, BP, SpO2, Resp).
- **Edge AI Video Upload Box**:
  - Drag-and-drop or select video file.
  - Calls `POST /analyze-video` with `multipart/form-data`.
  - Shows detected events with confidence scores, timestamps, and junction tags.
- **Police Emergency Override**:
  - Master override toggle switch.
  - Locks all 5 junctions to Green immediately.
  - Visual warning strobe and audio siren feedback.
- **Incident Audit Log**:
  - Immutable chronological log with category badges (CORRIDOR, DISPATCH, OVERRIDE, AI VISION, JUNCTION).
  - Search, filter chips, and JSON export.
- **Recharts Performance Bar Chart**:
  - Connects to `GET /simulation-results`.
  - Compares response times across **None (15.4m)** vs **Reactive (9.2m)** vs **Predictive (4.1m)**.
  - Visual summary cards showing **-73% delay reduction**.

---

## Quick Start

### 1. Start Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Start FastAPI Backend (Optional / Companion)
```bash
cd backend
pip install fastapi uvicorn python-multipart
python main.py
```
Backend runs at `http://localhost:8000`. The frontend automatically detects when FastAPI is online and switches from standalone simulation mode to live backend integration.
