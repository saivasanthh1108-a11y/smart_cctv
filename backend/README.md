# AegisCorridor FastAPI Emergency Dispatch & Vision AI Backend

FastAPI backend featuring:
- **Vision AI Accident Detection**: Runs YOLOv8 with ByteTrack tracking from `vision/weights/best.pt` (fallback `yolov8n.pt`) and applies the **overlap-and-stopped** accident rule from `vision/accident_detect.py`.
- **SQLite Database Persistence**: Replaces in-memory state with persistent tables (`incidents`, `police_overrides`, `vision_events`) in `corridor_incidents.db`.
- **Real-Time WebSocket Feed (`/ws`)**: Streams full system telemetry snapshots (junction phases, moving ambulance coords, and SQLite incidents) every second.
- **Security & Token Check**: Validates `Authorization: Bearer <token>`, `X-Token`, or `?token=` headers with default `aegis-corridor-token-2026`.
- **C-V2X Green Corridor Preemption**: Preempts 5 municipal signal controllers (`J1` to `J5`) for emergency vehicle transit.

---

## Architecture Overview

```
backend/
├── main.py                     # FastAPI application endpoints and WebSocket
├── database.py                 # SQLite database persistence layer
├── corridor_incidents.db       # Auto-generated SQLite database
└── vision/
    ├── accident_detect.py      # YOLOv8 ByteTrack + Overlap & Stopped rule
    └── weights/
        └── best.pt             # Custom weights path (fallback: yolov8n.pt)
```

---

## Endpoints

| Method | Endpoint | Description | Auth / Token |
|---|---|---|---|
| `GET` | `/` | System health, service status, and endpoints list | Token supported |
| `GET` | `/token/check` | Strict token validation endpoint | **Token Required** |
| `GET` | `/simulation-results` | Response time benchmark (None vs. Reactive vs. Predictive) | Token supported |
| `POST` | `/analyze-video` | Upload video; runs YOLOv8 ByteTrack + overlap-and-stopped rule | Token supported |
| `POST` | `/dispatch` | Confirm and dispatch incident, persists in SQLite, triggers green corridor | Token supported |
| `GET` | `/incidents` | Query all persisted incidents from SQLite | Token supported |
| `GET` | `/incidents/{id}` | Query single incident by ID from SQLite | Token supported |
| `POST` | `/police-override` | Engage / disengage emergency police green signal lock | Token supported |
| `WS` | `/ws` | WebSocket pushing real-time system state every 1.0 second | Public / Live stream |

---

## Overlap-and-Stopped Accident Detection Rule

Defined in [`vision/accident_detect.py`](./vision/accident_detect.py):
1. **YOLOv8 + ByteTrack Tracking**: Identifies and tracks vehicle bounding boxes across consecutive frames with unique track IDs.
2. **Spatial Overlap**: Measures Intersection-over-Union (IoU) between vehicle bounding box pairs. An intersection exceeding threshold triggers a collision candidate.
3. **Post-Impact Stoppage**: Tracks velocity/displacement in the subsequent frames. If velocity drops to near zero (stopped motionless in active roadway), an `ACCIDENT_DETECTED` event is triggered.
4. **SQLite Incident Insertion**: Detected accidents are automatically logged as high-severity incidents in the SQLite database.

---

## Running the Backend

### Prerequisites
```bash
pip install fastapi uvicorn python-multipart
# Optional for live model inference:
pip install ultralytics opencv-python
```

### Start Server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Example Requests

### 1. Test Token Check
```bash
curl -H "X-Token: aegis-corridor-token-2026" http://localhost:8000/token/check
```

### 2. Video Analysis (`POST /analyze-video`)
```bash
curl -X POST -F "file=@cctv_feed.mp4" http://localhost:8000/analyze-video
```

### 3. Connect to WebSocket (`/ws`)
Connect using any WebSocket client to `ws://localhost:8000/ws`. Telemetry payloads are pushed automatically every second.
