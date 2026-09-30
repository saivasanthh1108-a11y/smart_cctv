import React, { useState } from 'react';
import { AlertCircle, Navigation, Send, CheckCircle2, Siren, UserCheck, MapPin, Activity, Sparkles } from 'lucide-react';
import { INCIDENT_PRESETS } from '../data/mockData';

export default function IncidentPanel({
  activeIncident,
  setActiveIncident,
  isCorridorActive,
  onConfirmAndDispatch,
  isDispatching
}) {
  const [selectedPresetId, setSelectedPresetId] = useState(activeIncident.id);

  const handlePresetChange = (presetId) => {
    setSelectedPresetId(presetId);
    const chosen = INCIDENT_PRESETS.find(p => p.id === presetId);
    if (chosen) {
      setActiveIncident(chosen);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-400">
              <Siren className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono">Incident Dispatch Console</h2>
              <span className="text-[11px] text-slate-400">Computer-Aided Dispatch (CAD) System</span>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider ${
            isCorridorActive 
              ? 'bg-emerald-950 border border-emerald-500/60 text-emerald-300 animate-pulse'
              : 'bg-amber-950/80 border border-amber-500/50 text-amber-300'
          }`}>
            {isCorridorActive ? 'DISPATCHED & CORRIDOR ACTIVE' : 'AWAITING AUTHORIZATION'}
          </span>
        </div>

        {/* Preset Selector */}
        <div className="mb-4">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
            Emergency Scenario Presets:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {INCIDENT_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id)}
                disabled={isCorridorActive}
                className={`px-2.5 py-2 text-left rounded-lg text-xs font-medium transition-all border ${
                  selectedPresetId === p.id
                    ? 'bg-emerald-950/70 border-emerald-500/80 text-white shadow-md shadow-emerald-950/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                } ${isCorridorActive ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="font-semibold truncate">{p.id}</div>
                <div className="text-[10px] text-slate-400 truncate">{p.title.split('(')[0]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Incident Details Card */}
        <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800/80 space-y-2.5 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400">{activeIncident.id}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 border border-red-500/50 text-red-300">
                  {activeIncident.severity}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mt-1">{activeIncident.title}</h3>
            </div>
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>

          <div className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-mono text-[10px] uppercase block mb-0.5">Patient Clinical State:</span>
            {activeIncident.patient}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
            <div className="flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 text-[10px] block">Scene Origin:</span>
                <span className="text-slate-200 font-medium truncate block">{activeIncident.origin}</span>
              </div>
            </div>
            <div className="flex items-start gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-slate-400 text-[10px] block">Destination:</span>
                <span className="text-slate-200 font-medium truncate block">{activeIncident.destination}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <button
          onClick={onConfirmAndDispatch}
          disabled={isDispatching || isCorridorActive}
          className={`w-full relative group overflow-hidden py-3.5 px-4 rounded-xl font-bold font-mono text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl ${
            isCorridorActive
              ? 'bg-emerald-950/70 border border-emerald-600/60 text-emerald-300 cursor-default'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40 hover:shadow-emerald-700/50 hover:scale-[1.01] active:scale-[0.99]'
          }`}
        >
          {isCorridorActive ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Corridor Synchronized & Dispatched</span>
            </>
          ) : isDispatching ? (
            <>
              <Sparkles className="w-5 h-5 text-emerald-200 animate-spin" />
              <span>Coordinating Signals & Dispatching...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              <span>Confirm & Dispatch</span>
            </>
          )}
        </button>
        <p className="text-[10px] text-center text-slate-400 mt-2 font-mono">
          Preempts 5 municipal signal controllers & synchronizes green corridor wave
        </p>
      </div>
    </div>
  );
}
