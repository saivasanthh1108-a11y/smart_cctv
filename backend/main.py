import os
import time
import asyncio
import tempfile
import shutil
from typing import Optional, List, Dict, Any

from fastapi import (
    FastAPI,
    File,
    UploadFile,
    HTTPException,
    Header,
    Query,
    Depends,
    WebSocket,
    WebSocketDisconnect
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import SQLite persistence layer
from database import (
    init_db,
    save_incident,
    get_incident,
    list_incidents,
    log_police_override,
    save_detected_events
)

# Import Vision AI engine with YOLOv8, ByteTrack, and overlap-and-stopped accident rule
import sys
# Ensure current backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from vision.accident_detect import OverlapAndStoppedAccidentDetector

# Import simulation engine
try:
    from simulation.corridor_sim import run_corridor_simulation
except ImportError:
    import importlib.util
    sim_path = os.path.join(backend_dir, "simulation", "corridor_sim.py")
    if not os.path.exists(sim_path):
        sim_path = os.path.join(backend_dir, "..", "simulation", "corridor_sim.py")
    spec = importlib.util.spec_from_file_location("corridor_sim", sim_path)
    sim_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(sim_mod)
    run_corridor_simulation = sim_mod.run_corridor_simulation

# Initialize SQLite database on module import
init_db()

# Initialize FastAPI application
app = FastAPI(
    title="AegisCorridor Traffic AI & Emergency Dispatch API",
    version="2.0.0",
    description="FastAPI backend with YOLOv8 ByteTrack accident detection, SQLite incident persistence, WebSocket telemetry, and Green Corridor preemption"
)

# Enable CORS for Vite React frontend and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory system runtime state (broadcasted via WebSocket)
SYSTEM_STATE = {
    "corridor_active": False,
    "police_override": False,
    "active_incident_id": "INC-8942-ALPHA",
    "ambulance_speed_kmh": 68.0,
    "ambulance_progress": 0.35,
    "eta_seconds": 185,
    "junctions": [
        {"id": "J1", "name": "Central Ave & 1st St", "phase": "RED", "lockedGreen": False, "queueLength": 12, "timeSavedSec": 0},
        {"id": "J2", "name": "University Pkwy & 5th Ave", "phase": "YELLOW", "lockedGreen": False, "queueLength": 21, "timeSavedSec": 0},
        {"id": "J3", "name": "Metro Plaza & Grand Blvd", "phase": "RED", "lockedGreen": False, "queueLength": 29, "timeSavedSec": 0},
        {"id": "J4", "name": "Riverside Bridge Corridor", "phase": "GREEN", "lockedGreen": False, "queueLength": 7, "timeSavedSec": 0},
        {"id": "J5", "name": "Medical Center Crossing", "phase": "RED", "lockedGreen": False, "queueLength": 14, "timeSavedSec": 0}
    ],
    "start_time": time.time()
}

# Connected WebSockets pool
active_websockets: List[WebSocket] = []

# Initialize Vision AI Accident Detector
accident_detector = OverlapAndStoppedAccidentDetector(
    weights_path=os.path.join(backend_dir, "vision", "weights", "best.pt"),
    fallback_weights="yolov8n.pt"
)

# Token configuration
DEFAULT_API_TOKEN = os.getenv("CORRIDOR_API_TOKEN", "aegis-corridor-token-2026")

def verify_token(
    x_token: Optional[str] = Header(None, alias="X-Token"),
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None)
) -> str:
    """
    Validates token from Authorization Bearer header, X-Token header, or ?token query param.
    If a token is provided, it validates against DEFAULT_API_TOKEN.
    If omitted on public routes, allows access with default token.
    """
    extracted = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            extracted = parts[1]
        else:
            extracted = authorization
    elif x_token:
        extracted = x_token
    elif token:
        extracted = token

    if extracted and extracted != DEFAULT_API_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    return extracted or DEFAULT_API_TOKEN

def verify_token_strict(
    x_token: Optional[str] = Header(None, alias="X-Token"),
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None)
) -> str:
    """
    Strict token validation requiring valid token.
    """
    extracted = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            extracted = parts[1]
        else:
            extracted = authorization
    elif x_token:
        extracted = x_token
    elif token:
        extracted = token

    if not extracted:
        raise HTTPException(
            status_code=401,
            detail="Missing required authentication token. Provide via 'Authorization: Bearer <token>', 'X-Token' header, or '?token=' query parameter."
        )

    if extracted != DEFAULT_API_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    return extracted

# ----------------- Models -----------------
class IncidentDispatch(BaseModel):
    id: str
    title: Optional[str] = "Emergency Dispatch"
    severity: Optional[str] = "CRITICAL"
    origin: Optional[str] = "Scene"
    destination: Optional[str] = "Apex Trauma Center"
    patient: Optional[str] = None
    vitals: Optional[Dict[str, Any]] = None

class OverridePayload(BaseModel):
    active: bool
    badge_id: Optional[str] = "OFFICER-4492"
    reason: Optional[str] = "Corridor Priority Clear"
    timestamp: Optional[str] = None

# ----------------- REST Endpoints -----------------

@app.get("/")
def read_root(token: str = Depends(verify_token)):
    return {
        "status": "online",
        "service": "AegisCorridor Emergency Dispatch System & Vision AI",
        "version": "2.0.0",
        "database": "SQLite (corridor_incidents.db)",
        "vision_model": accident_detector.model_source,
        "token_authenticated": True,
        "endpoints": [
            "/simulation-results",
            "/analyze-video",
            "/dispatch",
            "/police-override",
            "/incidents",
            "/token/check",
            "/ws"
        ]
    }

@app.get("/token/check")
@app.get("/verify-token")
def check_token(token: str = Depends(verify_token_strict)):
    """Endpoint explicitly verifying token validity."""
    return {
        "valid": True,
        "authenticated": True,
        "token": token,
        "message": "Token authentication successful"
    }

@app.get("/simulation-results")
def get_simulation_results(
    runs: int = Query(100, description="Number of Monte Carlo corridor simulation runs"),
    token: str = Depends(verify_token)
):
    """
    GET /simulation-results: Runs simulation/corridor_sim.py and returns
    the average ambulance time and cross-traffic delay for the three modes (none, reactive, predictive) as JSON.
    """
    results = run_corridor_simulation(num_runs=runs)
    return results

@app.post("/analyze-video")
async def analyze_video_feed(
    file: Optional[UploadFile] = File(None),
    token: str = Depends(verify_token)
):
    """
    POST /analyze-video: Accepts a video file, runs YOLOv8 with ByteTrack from
    vision/weights/best.pt (fallback yolov8n.pt), applies the overlap-and-stopped
    accident rule from vision/accident_detect.py, stores any detected accident incidents
    in SQLite, and returns JSON with detected events (type, confidence, frame_time).
    """
    filename = file.filename if file else "traffic_corridor_feed.mp4"

    # Save uploaded video to temporary file for OpenCV / YOLO analysis
    temp_dir = tempfile.gettempdir()
    temp_video_path = os.path.join(temp_dir, f"temp_{int(time.time()*1000)}_{filename}")

    try:
        if file:
            with open(temp_video_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        else:
            with open(temp_video_path, "wb") as buffer:
                buffer.write(b"MOCK_VIDEO_STREAM_BYTES")

        # Run YOLOv8 ByteTrack + Overlap-and-Stopped Accident Detection Rule
        events = accident_detector.analyze_video(temp_video_path, filename=filename)

        # Persist detected events to SQLite
        save_detected_events(events)

        # Check if an accident event was detected. If so, automatically register incident in SQLite!
        accident_events = [e for e in events if "ACCIDENT" in e.get("type", "").upper()]
        if accident_events:
            first_acc = accident_events[0]
            new_incident = {
                "id": f"INC-VISION-{int(time.time())}",
                "title": f"CCTV AI Alert: Vehicle Collision ({first_acc.get('junction', 'J2')})",
                "severity": "CRITICAL",
                "origin": f"Intersection {first_acc.get('junction', 'J2')} Corridors",
                "destination": "Apex City Trauma & General Hospital",
                "status": "DETECTED",
                "corridor_id": f"CORR-AI-{int(time.time())}",
                "patient": first_acc.get("detail", "Collision detected via overlap-and-stopped vision rule."),
                "vitals": {"hr": 130, "bp": "90/60", "spo2": 92, "rr": 22}
            }
            save_incident(new_incident)

        return {
            "processed_file": filename,
            "timestamp": time.time(),
            "weights_source": accident_detector.model_source,
            "rule": "overlap_and_stopped",
            "events_count": len(events),
            "events": events
        }

    finally:
        # Clean up temporary video file
        if os.path.exists(temp_video_path):
            try:
                os.remove(temp_video_path)
            except Exception:
                pass

@app.post("/dispatch")
def dispatch_incident(
    incident: IncidentDispatch,
    token: str = Depends(verify_token)
):
    """
    POST /dispatch: Stores incident in SQLite database (replacing memory),
    activates the green corridor, locks all 5 junctions to green, and returns dispatch status.
    """
    corridor_id = f"CORR-{int(time.time())}"
    incident_dict = incident.dict()
    incident_dict["status"] = "DISPATCHED"
    incident_dict["corridor_id"] = corridor_id

    # Persist incident in SQLite
    saved = save_incident(incident_dict)

    # Update runtime system state
    SYSTEM_STATE["corridor_active"] = True
    SYSTEM_STATE["active_incident_id"] = incident.id
    SYSTEM_STATE["ambulance_progress"] = 0.0
    SYSTEM_STATE["eta_seconds"] = 240
    for j in SYSTEM_STATE["junctions"]:
        j["phase"] = "GREEN"
        j["lockedGreen"] = True
        j["timeSavedSec"] = 42

    return {
        "status": "dispatched",
        "incident_id": incident.id,
        "corridor_id": corridor_id,
        "signal_override": True,
        "junctions_cleared": ["J1", "J2", "J3", "J4", "J5"],
        "database": "sqlite_persisted",
        "record": saved
    }

@app.get("/incidents")
def get_all_incidents(
    limit: int = 50,
    token: str = Depends(verify_token)
):
    """Retrieves stored incidents from SQLite database."""
    incidents = list_incidents(limit=limit)
    return {
        "total": len(incidents),
        "source": "sqlite",
        "incidents": incidents
    }

@app.get("/incidents/{incident_id}")
def get_single_incident(
    incident_id: str,
    token: str = Depends(verify_token)
):
    """Retrieves specific incident from SQLite database."""
    item = get_incident(incident_id)
    if not item:
        raise HTTPException(status_code=404, detail="Incident not found in SQLite database")
    return item

@app.post("/police-override")
def police_override(
    payload: OverridePayload,
    token: str = Depends(verify_token)
):
    """
    POST /police-override: Logs override in SQLite, locks/unlocks junctions.
    """
    # Log in SQLite
    log_police_override(
        active=payload.active,
        badge_id=payload.badge_id or "OFFICER-4492",
        reason=payload.reason or "Corridor Priority Clear"
    )

    # Update system state
    SYSTEM_STATE["police_override"] = payload.active
    if payload.active:
        for j in SYSTEM_STATE["junctions"]:
            j["phase"] = "GREEN"
            j["lockedGreen"] = True
    else:
        for j in SYSTEM_STATE["junctions"]:
            if not SYSTEM_STATE["corridor_active"]:
                j["phase"] = "RED" if j["id"] in ["J1", "J3", "J5"] else "YELLOW"
                j["lockedGreen"] = False

    return {
        "status": "acknowledged",
        "override_active": payload.active,
        "signals_locked": "GREEN" if payload.active else "ADAPTIVE_AI",
        "database": "sqlite_logged",
        "timestamp": payload.timestamp or time.strftime("%Y-%m-%d %H:%M:%S")
    }

# ----------------- WebSocket Live State Stream -----------------

def get_current_system_snapshot() -> Dict[str, Any]:
    """Generates real-time telemetry snapshot pushed every second via WebSocket."""
    # Increment ambulance movement simulation
    if SYSTEM_STATE["corridor_active"] or SYSTEM_STATE["police_override"]:
        SYSTEM_STATE["ambulance_progress"] = min(1.0, SYSTEM_STATE["ambulance_progress"] + 0.02)
        SYSTEM_STATE["eta_seconds"] = max(0, int((1.0 - SYSTEM_STATE["ambulance_progress"]) * 220))
        SYSTEM_STATE["ambulance_speed_kmh"] = 72.4
    else:
        SYSTEM_STATE["ambulance_speed_kmh"] = 48.0

    # Fetch latest incident from SQLite
    all_incidents = list_incidents(limit=1)
    latest_inc = all_incidents[0] if all_incidents else None

    return {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "epoch": time.time(),
        "corridor_active": SYSTEM_STATE["corridor_active"],
        "police_override": SYSTEM_STATE["police_override"],
        "active_incident": latest_inc,
        "ambulance": {
            "callsign": "Apex Medic-402",
            "speed_kmh": round(SYSTEM_STATE["ambulance_speed_kmh"], 1),
            "progress": round(SYSTEM_STATE["ambulance_progress"], 3),
            "eta_seconds": SYSTEM_STATE["eta_seconds"]
        },
        "junctions": SYSTEM_STATE["junctions"],
        "database_storage": "SQLite",
        "vision_ai_status": "ONLINE (ByteTrack)",
        "active_connections": len(active_websockets)
    }

@app.websocket("/ws")
async def websocket_telemetry_feed(websocket: WebSocket):
    """
    WebSocket /ws: Pushes real-time system state (junctions, ambulance, incidents from SQLite)
    to connected clients every 1.0 second.
    """
    await websocket.accept()
    active_websockets.append(websocket)
    try:
        while True:
            snapshot = get_current_system_snapshot()
            await websocket.send_json(snapshot)
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        if websocket in active_websockets:
            active_websockets.remove(websocket)
    except Exception as err:
        if websocket in active_websockets:
            active_websockets.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
