import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LeafletMap from './components/LeafletMap';
import IncidentPanel from './components/IncidentPanel';
import HospitalAlertPanel from './components/HospitalAlertPanel';
import VideoUploadBox from './components/VideoUploadBox';
import PoliceOverrideToggle from './components/PoliceOverrideToggle';
import AuditLog from './components/AuditLog';
import SimulationChart from './components/SimulationChart';

import { checkBackendHealth, postDispatchIncident, postPoliceOverride } from './api';
import { INITIAL_JUNCTIONS, INCIDENT_PRESETS, AMBULANCE_START } from './data/mockData';
import { soundFx } from './utils/audio';

export default function App() {
  const [junctions, setJunctions] = useState(INITIAL_JUNCTIONS);
  const [isCorridorActive, setIsCorridorActive] = useState(false);
  const [isPoliceOverride, setIsPoliceOverride] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [activeIncident, setActiveIncident] = useState(INCIDENT_PRESETS[0]);
  const [isDispatching, setIsDispatching] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Ambulance movement & ETA states
  const [ambulanceProgress, setAmbulanceProgress] = useState(0);
  const [ambulancePos, setAmbulancePos] = useState(AMBULANCE_START.coords);
  const [etaSeconds, setEtaSeconds] = useState(285); // ~4m 45s initially

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'log-01',
      timestamp: '16:04:12',
      category: 'SYSTEM',
      message: 'AegisCorridor System Kernel v2.4 initialized. Monitoring 5 traffic intersections.'
    },
    {
      id: 'log-02',
      timestamp: '16:05:00',
      category: 'JUNCTION',
      message: 'Signal controller telemetry linked: J1, J2, J3, J4, J5 online (C-V2X 5G Hub).'
    },
    {
      id: 'log-03',
      timestamp: '16:08:22',
      category: 'DISPATCH',
      message: 'Emergency CAD inbound: Acute STEMI report (#INC-8942-ALPHA) queued for dispatch.'
    }
  ]);

  // Helper to add audit logs
  const addAuditLog = (category, message) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    setAuditLogs(prev => [
      {
        id: 'log-' + Date.now() + Math.random().toString(36).slice(2, 5),
        timestamp: timeStr,
        category,
        message
      },
      ...prev.slice(0, 99) // keep latest 100 entries
    ]);
  };

  // Check Backend Health on mount and periodically
  const pingBackend = async () => {
    const healthy = await checkBackendHealth();
    setBackendConnected(healthy);
  };

  useEffect(() => {
    pingBackend();
    const interval = setInterval(pingBackend, 10000);

    // Connect to FastAPI /ws WebSocket telemetry feed
    let ws = null;
    try {
      ws = new WebSocket('ws://localhost:8000/ws');
      ws.onopen = () => {
        setBackendConnected(true);
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.junctions && isCorridorActive) {
            // Optional sync from backend
          }
        } catch (e) {}
      };
      ws.onerror = () => {};
      ws.onclose = () => {};
    } catch (e) {}

    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, [isCorridorActive]);

  // Synchronize dynamic ETA based on ambulance progress
  useEffect(() => {
    if (!isCorridorActive && !isPoliceOverride) {
      setEtaSeconds(285);
      return;
    }
    const remaining = Math.max(0, Math.round((1 - ambulanceProgress) * 240));
    setEtaSeconds(remaining);
  }, [ambulanceProgress, isCorridorActive, isPoliceOverride]);

  // Action: Confirm & Dispatch
  const handleConfirmAndDispatch = async () => {
    setIsDispatching(true);
    addAuditLog('DISPATCH', `Confirming incident #${activeIncident.id} dispatch to Medic-402.`);

    if (soundEnabled) {
      soundFx.playDispatchBeep();
    }

    try {
      await postDispatchIncident(activeIncident);
    } catch (e) {
      console.warn('Dispatch API fallback handled');
    }

    // Wait 600ms for simulated coordination
    setTimeout(() => {
      setIsDispatching(false);
      setIsCorridorActive(true);

      if (soundEnabled) {
        soundFx.playCorridorActiveChime();
      }

      // Turn all 5 junctions green
      setJunctions(prev => prev.map(j => ({
        ...j,
        phase: 'GREEN',
        lockedGreen: true,
        timeSavedSec: 42
      })));

      // Reset progress to 0 to begin the run
      setAmbulanceProgress(0);

      addAuditLog('CORRIDOR', `Green Corridor Activated: 5 junctions (J1-J5) pre-cleared for ALS Medic-402.`);
      addAuditLog('JUNCTION', `Preemption commands executed: Northbound priority waves held green.`);
    }, 600);
  };

  // Action: Police Override Toggle
  const handleToggleOverride = async (newState, badgeId, reason) => {
    setIsPoliceOverride(newState);
    try {
      await postPoliceOverride(newState);
    } catch (e) {
      console.warn('Override API fallback');
    }

    if (newState) {
      // Force all junctions green unconditionally
      setJunctions(prev => prev.map(j => ({
        ...j,
        phase: 'GREEN',
        lockedGreen: true
      })));
      addAuditLog('POLICE_OVERRIDE', `EMERGENCY POLICE OVERRIDE ENGAGED by ${badgeId}: Reason: ${reason}`);
    } else {
      // Return to corridor state or baseline
      setJunctions(prev => prev.map(j => ({
        ...j,
        phase: isCorridorActive ? 'GREEN' : j.defaultPhase,
        lockedGreen: isCorridorActive
      })));
      addAuditLog('POLICE_OVERRIDE', `Police override disengaged by ${badgeId}. Control returned to adaptive AI.`);
    }
  };

  // Corridor Run Reached Hospital
  const handleCorridorComplete = () => {
    addAuditLog('CORRIDOR', `Medic-402 successfully arrived at Apex City Trauma Center ER. Total corridor transit: 3m 42s.`);
  };

  // Events detected from video upload
  const handleEventsDetected = (events) => {
    addAuditLog('AI_VISION', `Video stream processed: ${events.length} target telemetry detections confirmed.`);
  };

  const handleClearLogs = () => {
    setAuditLogs([]);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        isCorridorActive={isCorridorActive}
        isPoliceOverride={isPoliceOverride}
        backendConnected={backendConnected}
        checkConnection={pingBackend}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        activeIncident={activeIncident}
      />

      {/* Main Content Layout */}
      <main className="flex-1 p-3 lg:p-6 max-w-[1700px] w-full mx-auto space-y-6">
        {/* Top Grid: Interactive Map + Mission Control Panels */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          {/* Map Column (7 cols on XL) */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            {/* Map Frame */}
            <div className="h-[520px] lg:h-[600px] w-full">
              <LeafletMap
                junctions={junctions}
                isCorridorActive={isCorridorActive}
                isPoliceOverride={isPoliceOverride}
                ambulancePos={ambulancePos}
                setAmbulancePos={setAmbulancePos}
                ambulanceProgress={ambulanceProgress}
                setAmbulanceProgress={setAmbulanceProgress}
                onCorridorComplete={handleCorridorComplete}
              />
            </div>

            {/* Recharts Simulation Results Bar Chart below map */}
            <div className="h-full">
              <SimulationChart addAuditLog={addAuditLog} />
            </div>
          </div>

          {/* Right Column: Incident, Hospital, Video Upload, Police Override, Audit Log (5 cols on XL) */}
          <div className="xl:col-span-5 flex flex-col gap-6">
            {/* Incident Panel with Confirm & Dispatch */}
            <div>
              <IncidentPanel
                activeIncident={activeIncident}
                setActiveIncident={setActiveIncident}
                isCorridorActive={isCorridorActive}
                onConfirmAndDispatch={handleConfirmAndDispatch}
                isDispatching={isDispatching}
              />
            </div>

            {/* Hospital Alert Panel (Severity, Dynamic ETA) */}
            <div>
              <HospitalAlertPanel
                activeIncident={activeIncident}
                isCorridorActive={isCorridorActive}
                etaSeconds={etaSeconds}
              />
            </div>

            {/* Video Upload Box (/analyze-video) */}
            <div>
              <VideoUploadBox
                onEventsDetected={handleEventsDetected}
                addAuditLog={addAuditLog}
              />
            </div>

            {/* Police Override Toggle */}
            <div>
              <PoliceOverrideToggle
                isPoliceOverride={isPoliceOverride}
                onToggleOverride={handleToggleOverride}
                soundEnabled={soundEnabled}
              />
            </div>

            {/* Audit Log */}
            <div>
              <AuditLog
                logs={auditLogs}
                onClearLogs={handleClearLogs}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0F172A]/80 py-3 px-6 text-center text-xs text-slate-500 font-mono">
        AegisCorridor System • Connected to FastAPI at <span className="text-emerald-400">http://localhost:8000</span> • Connected to V2X Emergency Corridors
      </footer>
    </div>
  );
}
