import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Play, Pause, RotateCcw, FastForward, Navigation2, Compass, MapPin, Shield, Zap } from 'lucide-react';
import { HOSPITAL_LOCATION, AMBULANCE_START } from '../data/mockData';

// Fix Leaflet default icon path issues in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG Icons
const createJunctionIcon = (junction, isGreenCorridor) => {
  const isGreen = isGreenCorridor || junction.phase === 'GREEN' || junction.lockedGreen;
  const isYellow = !isGreen && junction.phase === 'YELLOW';
  const color = isGreen ? '#10B981' : isYellow ? '#F59E0B' : '#EF4444';
  const glow = isGreen ? 'rgba(16, 185, 129, 0.6)' : isYellow ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)';

  return L.divIcon({
    className: 'custom-junction-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
        ${isGreen ? `<div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background: ${glow}; animation: corridorPulse 1.8s infinite;"></div>` : ''}
        <div style="position: relative; z-index: 2; width: 32px; height: 32px; border-radius: 50%; background: #111827; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px ${glow};">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: ${color};"></div>
        </div>
        <div style="position: absolute; bottom: -18px; white-space: nowrap; font-family: monospace; font-size: 10px; font-weight: bold; color: ${isGreen ? '#34D399' : '#D1D5DB'}; background: rgba(17, 24, 39, 0.9); padding: 1px 5px; border-radius: 4px; border: 1px solid ${color}66;">
          ${junction.id} ${isGreen ? '• GREEN' : ''}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  });
};

const createAmbulanceIcon = (speedKmh, isCorridorActive) => {
  return L.divIcon({
    className: 'custom-ambulance-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 50px; height: 50px;">
        <div style="position: absolute; width: 46px; height: 46px; border-radius: 50%; background: rgba(239, 68, 68, 0.35); animation: sirenFlash 0.7s infinite;"></div>
        <div style="position: relative; z-index: 3; width: 36px; height: 36px; border-radius: 10px; background: #DC2626; border: 2px solid #FEF2F2; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(239, 68, 68, 0.8);">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2 10.9 2 11.2 2 11.5V16c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
            <path d="M9 12h4"/>
            <path d="M11 10v4"/>
          </svg>
        </div>
        <div style="position: absolute; top: -20px; white-space: nowrap; font-family: monospace; font-size: 10px; font-weight: 800; color: #FFFFFF; background: #DC2626; padding: 1px 6px; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
          MED-402 • ${speedKmh} km/h
        </div>
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25]
  });
};

const createHospitalIcon = () => {
  return L.divIcon({
    className: 'custom-hospital-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 48px; height: 48px;">
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(16, 185, 129, 0.3); animation: ping 2.5s infinite;"></div>
        <div style="position: relative; z-index: 2; width: 34px; height: 34px; border-radius: 8px; background: #065F46; border: 2px solid #34D399; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(16, 185, 129, 0.6);">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M19 10.5h-5.5V5c0-.6-.4-1-1-1h-1c-.6 0-1 .4-1 1v5.5H5c-.6 0-1 .4-1 1v1c0 .6.4 1 1 1h5.5V20c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-5.5H19c.6 0 1-.4 1-1v-1c0-.6-.4-1-1-1z"/>
          </svg>
        </div>
        <div style="position: absolute; bottom: -18px; white-space: nowrap; font-family: monospace; font-size: 10px; font-weight: bold; color: #34D399; background: rgba(6, 78, 59, 0.9); padding: 1px 6px; border-radius: 4px; border: 1px solid #10B981;">
          APEX TRAUMA ER
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24]
  });
};

export default function LeafletMap({
  junctions,
  isCorridorActive,
  isPoliceOverride,
  ambulancePos,
  setAmbulancePos,
  ambulanceProgress,
  setAmbulanceProgress,
  onCorridorComplete
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const junctionMarkersRef = useRef({});
  const ambulanceMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const clearedPolylineRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(Date.now());

  // Define route waypoints: start -> 5 junctions -> hospital
  const waypoints = [
    AMBULANCE_START.coords,
    ...junctions.map(j => j.coords),
    HOSPITAL_LOCATION.coords
  ];

  // Helper to interpolate position along waypoints by progress ratio (0 to 1)
  const getInterpolatedPosition = (progress) => {
    const totalSegments = waypoints.length - 1;
    const clamped = Math.max(0, Math.min(1, progress));
    const segmentIndex = Math.min(Math.floor(clamped * totalSegments), totalSegments - 1);
    const segmentProgress = (clamped * totalSegments) - segmentIndex;

    const p1 = waypoints[segmentIndex];
    const p2 = waypoints[segmentIndex + 1];

    const lat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
    const lng = p1[1] + (p2[1] - p1[1]) * segmentProgress;

    return [lat, lng];
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [40.726, -73.992],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      // CartoDB Dark Matter tiles for ultra-sleek UI
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Add Zoom Control at top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add Planned Route Line
      routePolylineRef.current = L.polyline(waypoints, {
        color: '#374151',
        weight: 6,
        dashArray: '8, 8',
        opacity: 0.8
      }).addTo(map);

      // Add Cleared Green Corridor Trail Line
      clearedPolylineRef.current = L.polyline([waypoints[0], waypoints[0]], {
        color: '#10B981',
        weight: 6,
        opacity: 0.95
      }).addTo(map);

      // Add Hospital Marker
      const hospitalMarker = L.marker(HOSPITAL_LOCATION.coords, {
        icon: createHospitalIcon()
      }).addTo(map);

      hospitalMarker.bindPopup(`
        <div style="font-family: monospace; padding: 4px;">
          <div style="font-weight: bold; color: #10B981; font-size: 13px;">${HOSPITAL_LOCATION.name}</div>
          <div style="color: #9CA3AF; font-size: 11px; margin-top: 2px;">${HOSPITAL_LOCATION.level}</div>
          <div style="margin-top: 6px; font-size: 11px; color: #E5E7EB; border-top: 1px solid #374151; padding-top: 4px;">
            <div>• Trauma Bay #2 Prepped</div>
            <div>• 4 ICU Beds Available</div>
            <div>• Lead: ${HOSPITAL_LOCATION.onDutyLead}</div>
          </div>
        </div>
      `);

      // Add Ambulance Marker
      ambulanceMarkerRef.current = L.marker(ambulancePos || waypoints[0], {
        icon: createAmbulanceIcon(68, isCorridorActive)
      }).addTo(map);

      ambulanceMarkerRef.current.bindPopup(`
        <div style="font-family: monospace; padding: 4px;">
          <div style="font-weight: bold; color: #EF4444; font-size: 13px;">${AMBULANCE_START.callsign}</div>
          <div style="color: #9CA3AF; font-size: 11px;">${AMBULANCE_START.type}</div>
          <div style="margin-top: 6px; font-size: 11px; color: #E5E7EB; border-top: 1px solid #374151; padding-top: 4px;">
            <div>• Status: Priority Alpha Transit</div>
            <div>• Target: Apex Trauma Center</div>
            <div>• V2X Preemption Wave: Synced</div>
          </div>
        </div>
      `);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update or render Junction Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    junctions.forEach((junction) => {
      const isGreen = isCorridorActive || isPoliceOverride || junction.phase === 'GREEN';
      const icon = createJunctionIcon(junction, isGreen);

      if (!junctionMarkersRef.current[junction.id]) {
        const marker = L.marker(junction.coords, { icon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: monospace; padding: 4px; min-width: 180px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #374151; padding-bottom: 4px; margin-bottom: 6px;">
              <span style="font-weight: bold; color: #F3F4F6;">${junction.id}</span>
              <span style="font-size: 10px; font-weight: bold; color: ${isGreen ? '#10B981' : '#EF4444'};">
                ${isGreen ? 'GREEN CORRIDOR' : 'CYCLE RED'}
              </span>
            </div>
            <div style="font-size: 11px; color: #D1D5DB; line-height: 1.4;">
              <div>Location: <b>${junction.name}</b></div>
              <div>Congestion: <b>${junction.congestion}</b></div>
              <div>Queue: <b>${junction.queueLength} vehicles</b></div>
              <div style="margin-top: 4px; color: #10B981;">Time Saved: <b>${junction.timeSavedSec}s</b></div>
            </div>
          </div>
        `);
        junctionMarkersRef.current[junction.id] = marker;
      } else {
        junctionMarkersRef.current[junction.id].setIcon(icon);
      }
    });
  }, [junctions, isCorridorActive, isPoliceOverride]);

  // Update Route Polyline appearance when corridor is active
  useEffect(() => {
    if (routePolylineRef.current) {
      if (isCorridorActive || isPoliceOverride) {
        routePolylineRef.current.setStyle({
          color: '#10B981',
          weight: 7,
          dashArray: null,
          opacity: 0.6
        });
      } else {
        routePolylineRef.current.setStyle({
          color: '#374151',
          weight: 6,
          dashArray: '8, 8',
          opacity: 0.8
        });
      }
    }
  }, [isCorridorActive, isPoliceOverride]);

  // Animation Loop for Moving Ambulance Marker
  useEffect(() => {
    if (!isPlaying) return;

    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setAmbulanceProgress((prev) => {
        // Base trip duration is ~45 seconds without corridor, ~25 seconds with corridor
        const tripDuration = (isCorridorActive || isPoliceOverride) ? 22 : 45;
        const step = (delta / tripDuration) * speedMultiplier;
        const next = prev + step;

        if (next >= 1) {
          onCorridorComplete?.();
          return 1;
        }

        const newPos = getInterpolatedPosition(next);
        setAmbulancePos(newPos);

        if (ambulanceMarkerRef.current) {
          ambulanceMarkerRef.current.setLatLng(newPos);
          const currentSpeed = (isCorridorActive || isPoliceOverride) ? 72 : 48;
          ambulanceMarkerRef.current.setIcon(createAmbulanceIcon(currentSpeed, isCorridorActive || isPoliceOverride));
        }

        // Update trail polyline
        if (clearedPolylineRef.current) {
          const clearedPoints = [waypoints[0], newPos];
          clearedPolylineRef.current.setLatLngs(clearedPoints);
        }

        return next;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, speedMultiplier, isCorridorActive, isPoliceOverride]);

  // Reset Ambulance
  const handleResetAmbulance = () => {
    setAmbulanceProgress(0);
    const start = waypoints[0];
    setAmbulancePos(start);
    if (ambulanceMarkerRef.current) {
      ambulanceMarkerRef.current.setLatLng(start);
    }
    if (clearedPolylineRef.current) {
      clearedPolylineRef.current.setLatLngs([start, start]);
    }
    lastTimeRef.current = Date.now();
  };

  // Recenter Map
  const handleRecenter = () => {
    if (mapInstanceRef.current && ambulancePos) {
      mapInstanceRef.current.setView(ambulancePos, 14, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0B0F19]">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[460px] z-0" />

      {/* Floating HUD Top Overlay: Green Corridor State & Telemetry */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="glass-panel px-3.5 py-2 rounded-xl border border-slate-700/80 pointer-events-auto flex items-center gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              isPoliceOverride 
                ? 'bg-red-500 animate-ping' 
                : isCorridorActive 
                  ? 'bg-emerald-400 animate-ping' 
                  : 'bg-slate-400'
            }`}></span>
            <span className="font-mono text-xs font-bold text-white tracking-wider">
              {isPoliceOverride
                ? 'OVERRIDE: ALL 5 SIGNALS LOCKED GREEN'
                : isCorridorActive
                  ? 'V2X PREEMPTIVE GREEN CORRIDOR ENGAGED'
                  : 'MONITORING 5 TRAFFIC JUNCTIONS'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>

          <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">
              Corridor Progress: <b className="text-emerald-400 font-bold">{Math.round(ambulanceProgress * 100)}%</b>
            </span>
            <span className="text-slate-400">
              Speed: <b className="text-white">{(isCorridorActive || isPoliceOverride) ? '72 km/h' : '48 km/h'}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Floating HUD Bottom Overlay: Animation & Simulation Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        {/* Left: Playback Controls */}
        <div className="glass-panel p-2 rounded-xl border border-slate-700 pointer-events-auto flex items-center gap-1.5 shadow-lg">
          <button
            onClick={() => { setIsPlaying(!isPlaying); lastTimeRef.current = Date.now(); }}
            title={isPlaying ? 'Pause Ambulance Simulation' : 'Play Ambulance Simulation'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleResetAmbulance}
            title="Reset Ambulance to Start"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={() => setSpeedMultiplier(s => s === 1 ? 2 : s === 2 ? 4 : 1)}
            title="Change Simulation Speed"
            className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1 transition-colors"
          >
            <FastForward className="w-3.5 h-3.5 text-teal-400" />
            <span>{speedMultiplier}x</span>
          </button>

          <button
            onClick={handleRecenter}
            title="Focus On Ambulance"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <Navigation2 className="w-4 h-4 text-teal-400" />
          </button>
        </div>

        {/* Right: Map Legend */}
        <div className="glass-panel px-3 py-1.5 rounded-xl border border-slate-700 pointer-events-auto hidden md:flex items-center gap-3 text-[11px] font-mono shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
            <span className="text-slate-300">5 Junctions (Green Corridor)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500"></span>
            <span className="text-slate-300">Ambulance MED-402</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-teal-500"></span>
            <span className="text-slate-300">Apex Hospital ER</span>
          </div>
        </div>
      </div>
    </div>
  );
}
