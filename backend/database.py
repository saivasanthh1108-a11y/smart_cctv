"""
SQLite Database module for AegisCorridor Emergency Dispatch System.
Replaces in-memory storage with persistent SQLite tables for:
- Incidents
- Police Overrides
- Vision AI Detected Events
"""

import sqlite3
import os
import json
import time
from typing import List, Dict, Optional, Any

DB_PATH = os.path.join(os.path.dirname(__file__), "corridor_incidents.db")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes SQLite database tables if they do not exist."""
    conn = get_connection()
    cursor = conn.cursor()

    # Incidents table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            title TEXT,
            severity TEXT DEFAULT 'CRITICAL',
            origin TEXT,
            destination TEXT,
            status TEXT DEFAULT 'DISPATCHED',
            corridor_id TEXT,
            created_at TEXT,
            details TEXT,
            vitals_json TEXT
        )
    """)

    # Police Overrides log table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS police_overrides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            active INTEGER NOT NULL,
            badge_id TEXT,
            reason TEXT,
            timestamp TEXT
        )
    """)

    # Vision Events table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vision_events (
            id TEXT PRIMARY KEY,
            event_type TEXT,
            label TEXT,
            confidence REAL,
            frame_time TEXT,
            detail TEXT,
            severity TEXT,
            junction TEXT,
            created_at TEXT
        )
    """)

    # Audio Events & Multimodal Fusion table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audio_events (
            id TEXT PRIMARY KEY,
            filename TEXT,
            siren_score REAL,
            crash_score REAL,
            fused_score REAL,
            modality TEXT,
            decision TEXT,
            junction TEXT,
            created_at TEXT,
            details_json TEXT
        )
    """)

    # Pre-populate initial sample incidents if database is brand new
    cursor.execute("SELECT COUNT(*) as count FROM incidents")
    if cursor.fetchone()["count"] == 0:
        initial_incidents = [
            (
                "INC-8942-ALPHA",
                "Acute ST-Elevation Myocardial Infarction (STEMI)",
                "CRITICAL",
                "742 Evergreen Terrace (Downtown Sector 3)",
                "Apex Trauma & General Hospital (Cath Lab Ready)",
                "READY_FOR_DISPATCH",
                "CORR-8942",
                time.strftime("%Y-%m-%d %H:%M:%S"),
                "Patient: Male, 58 yrs | Severe Chest Angina, Vitals Dropping",
                json.dumps({"hr": 128, "bp": "88/56", "spo2": 91, "rr": 24})
            ),
            (
                "INC-7721-BRAVO",
                "High-Velocity Multi-Vehicle Collision (Trauma Alpha)",
                "CRITICAL",
                "Interstate 495 Mile Marker 12",
                "Apex Trauma Center (OR #2 Reserved)",
                "PENDING",
                "CORR-7721",
                time.strftime("%Y-%m-%d %H:%M:%S"),
                "Patient: Female, 31 yrs | Polytrauma, Suspected Hemothorax",
                json.dumps({"hr": 138, "bp": "82/50", "spo2": 88, "rr": 28})
            )
        ]
        cursor.executemany("""
            INSERT INTO incidents (id, title, severity, origin, destination, status, corridor_id, created_at, details, vitals_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_incidents)

    conn.commit()
    conn.close()

def save_incident(incident: Dict[str, Any]) -> Dict[str, Any]:
    """Inserts or updates an incident in the SQLite database."""
    conn = get_connection()
    cursor = conn.cursor()

    incident_id = incident.get("id") or f"INC-{int(time.time())}"
    title = incident.get("title", "Emergency Incident")
    severity = incident.get("severity", "CRITICAL")
    origin = incident.get("origin", "Scene Location")
    destination = incident.get("destination", "Apex Trauma Center")
    status = incident.get("status", "DISPATCHED")
    corridor_id = incident.get("corridor_id") or f"CORR-{int(time.time())}"
    created_at = incident.get("created_at") or time.strftime("%Y-%m-%d %H:%M:%S")
    details = incident.get("patient") or incident.get("details") or ""
    vitals_json = json.dumps(incident.get("vitals", {}))

    cursor.execute("""
        INSERT INTO incidents (id, title, severity, origin, destination, status, corridor_id, created_at, details, vitals_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            title=excluded.title,
            severity=excluded.severity,
            origin=excluded.origin,
            destination=excluded.destination,
            status=excluded.status,
            corridor_id=excluded.corridor_id,
            details=excluded.details,
            vitals_json=excluded.vitals_json
    """, (incident_id, title, severity, origin, destination, status, corridor_id, created_at, details, vitals_json))

    conn.commit()
    conn.close()

    return {
        "id": incident_id,
        "title": title,
        "severity": severity,
        "origin": origin,
        "destination": destination,
        "status": status,
        "corridor_id": corridor_id,
        "created_at": created_at,
        "details": details
    }

def get_incident(incident_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single incident by ID from SQLite."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        d = dict(row)
        if d.get("vitals_json"):
            try:
                d["vitals"] = json.loads(d["vitals_json"])
            except Exception:
                pass
        return d
    return None

def list_incidents(limit: int = 50) -> List[Dict[str, Any]]:
    """Lists incidents from SQLite sorted by creation date."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        if d.get("vitals_json"):
            try:
                d["vitals"] = json.loads(d["vitals_json"])
            except Exception:
                pass
        result.append(d)
    return result

def log_police_override(active: bool, badge_id: str = "OFFICER-4492", reason: str = ""):
    """Logs a police override state transition in SQLite."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO police_overrides (active, badge_id, reason, timestamp)
        VALUES (?, ?, ?, ?)
    """, (1 if active else 0, badge_id, reason, time.strftime("%Y-%m-%d %H:%M:%S")))
    conn.commit()
    conn.close()

def save_detected_events(events: List[Dict[str, Any]]):
    """Stores vision AI detected events in SQLite."""
    conn = get_connection()
    cursor = conn.cursor()
    for e in events:
        eid = e.get("id") or f"evt-{int(time.time()*1000)}"
        cursor.execute("""
            INSERT OR REPLACE INTO vision_events (id, event_type, label, confidence, frame_time, detail, severity, junction, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            eid,
            e.get("type", "EVENT"),
            e.get("label", "Detection"),
            float(e.get("confidence", 0.95)),
            e.get("frame_time", "00:00.00"),
            e.get("detail", ""),
            e.get("severity", "info"),
            e.get("junction", "J1"),
            time.strftime("%Y-%m-%d %H:%M:%S")
        ))
    conn.commit()
    conn.close()

def save_audio_event(event_data: Dict[str, Any]) -> str:
    """Stores audio classification and multimodal fusion result in SQLite."""
    conn = get_connection()
    cursor = conn.cursor()
    eid = event_data.get("id") or f"aud-{int(time.time()*1000)}"
    cursor.execute("""
        INSERT OR REPLACE INTO audio_events (id, filename, siren_score, crash_score, fused_score, modality, decision, junction, created_at, details_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        eid,
        event_data.get("filename", "audio.wav"),
        float(event_data.get("siren_score", 0.0)),
        float(event_data.get("crash_score", 0.0)),
        float(event_data.get("fused_score", 0.0)),
        event_data.get("modality", "accident"),
        event_data.get("decision", "NORMAL"),
        event_data.get("junction", "J2"),
        time.strftime("%Y-%m-%d %H:%M:%S"),
        json.dumps(event_data)
    ))
    conn.commit()
    conn.close()
    return eid

def list_audio_events(limit: int = 50) -> List[Dict[str, Any]]:
    """Lists audio events from SQLite."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audio_events ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        if d.get("details_json"):
            try:
                d["details"] = json.loads(d["details_json"])
            except Exception:
                pass
        result.append(d)
    return result

