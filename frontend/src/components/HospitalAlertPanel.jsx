import React from 'react';
import { Building2, HeartPulse, Clock, ShieldCheck, Stethoscope, Bed, AlertOctagon, Activity } from 'lucide-react';
import { HOSPITAL_LOCATION } from '../data/mockData';

export default function HospitalAlertPanel({
  activeIncident,
  isCorridorActive,
  etaSeconds
}) {
  const formatETA = (seconds) => {
    if (!isCorridorActive) return '04:45';
    if (seconds <= 0) return 'ARRIVED AT ER';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between h-full">
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono">Hospital Alert & ER Status</h2>
              <span className="text-[11px] text-slate-400">Receiving Trauma Facility Real-Time Link</span>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-950/70 border border-emerald-500/50 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            BAY 2 PREPARED
          </span>
        </div>

        {/* Big ETA and Severity Hero Card */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Dynamic ETA */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl p-3.5 border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                ESTIMATED ETA
              </span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase">
                {isCorridorActive ? 'SYNCED' : 'EST'}
              </span>
            </div>
            <div className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-white flex items-baseline gap-1">
              {formatETA(etaSeconds)}
              {isCorridorActive && etaSeconds > 0 && (
                <span className="text-xs font-normal text-slate-400 font-sans">min:sec</span>
              )}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Traffic Preemption Active (-73% Delay)
            </div>
          </div>

          {/* Severity & Code */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl p-3.5 border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span className="flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                SEVERITY LEVEL
              </span>
              <span className="text-[10px] text-red-400 font-bold">CODE RED</span>
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-red-400">
              {activeIncident.severity}
            </div>
            <div className="text-[10px] text-slate-300 mt-1 font-medium truncate">
              Immediate Surgical Team Standby
            </div>
          </div>
        </div>

        {/* Hospital Resources Card */}
        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">{HOSPITAL_LOCATION.name}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {HOSPITAL_LOCATION.level}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <Bed className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Trauma Bays:</span>
                <span className="font-bold text-white font-mono">{HOSPITAL_LOCATION.traumaBaysAvailable} Available</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Trauma Lead:</span>
                <span className="font-medium text-white truncate block text-[11px]">Dr. R. Vance, MD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Patient Telemetry Stream */}
        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <HeartPulse className="w-3.5 h-3.5 animate-pulse text-red-400" />
              IN-TRANSIT VITALS TELEMETRY
            </span>
            <span className="text-[10px] text-slate-400">AMBULANCE MED-402</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">HEART RATE</div>
              <div className="text-sm font-bold text-red-400">{activeIncident.vitals.hr} <span className="text-[9px] text-slate-400 font-normal">BPM</span></div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">BP (SYS/DIA)</div>
              <div className="text-sm font-bold text-amber-300">{activeIncident.vitals.bp}</div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">SpO2</div>
              <div className="text-sm font-bold text-teal-300">{activeIncident.vitals.spo2}%</div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">RESP</div>
              <div className="text-sm font-bold text-slate-200">{activeIncident.vitals.rr} <span className="text-[9px] text-slate-400 font-normal">/m</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Alert Note */}
      <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Pre-hospital medical telemetry directly routed to Emergency Trauma Bay #2.</span>
      </div>
    </div>
  );
}
