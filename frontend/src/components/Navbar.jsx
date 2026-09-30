import React, { useState, useEffect } from 'react';
import { Shield, Radio, Wifi, WifiOff, Volume2, VolumeX, AlertTriangle, Clock } from 'lucide-react';

export default function Navbar({
  isCorridorActive,
  isPoliceOverride,
  backendConnected,
  checkConnection,
  soundEnabled,
  setSoundEnabled,
  activeIncident
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-slate-800 bg-[#0F172A]/90 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/20">
            <Shield className="w-5 h-5 text-white" />
            {(isCorridorActive || isPoliceOverride) && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                AEGIS<span className="text-emerald-400">CORRIDOR</span>
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold tracking-wider">
                v2.4 AI-C-V2X
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Intelligent Emergency Transit & Adaptive Traffic Control</p>
          </div>
        </div>

        {/* Center: System Status Pill */}
        <div className="flex items-center gap-3">
          {isPoliceOverride ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/80 border border-red-500/60 text-red-300 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold font-mono tracking-wider">POLICE OVERRIDE ENGAGED</span>
            </div>
          ) : isCorridorActive ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-900/40">
              <Radio className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-xs font-bold font-mono tracking-wider">GREEN CORRIDOR SYNCHRONIZED</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="text-xs font-medium font-mono">SYSTEM STANDBY (MONITORING)</span>
            </div>
          )}
        </div>

        {/* Right: Telemetry & Connection Controls */}
        <div className="flex items-center gap-3">
          {/* Clock */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-slate-900/80 border border-slate-800 px-2.5 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{time.toLocaleTimeString()}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Alert Audio' : 'Enable Alert Audio'}
            className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline font-mono text-[11px]">{soundEnabled ? 'AUDIO ON' : 'MUTED'}</span>
          </button>

          {/* Backend Connection Indicator */}
          <div
            onClick={checkConnection}
            title={`FastAPI backend at http://localhost:8000 (${backendConnected ? 'Connected' : 'Offline / Click to retry'})`}
            className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              backendConnected
                ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/50'
            }`}
          >
            {backendConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden lg:inline text-[11px]">FASTAPI :8000 LIVE</span>
                <span className="lg:hidden text-[11px]">ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline text-[11px]">FASTAPI OFFLINE (SIM MODE)</span>
                <span className="lg:hidden text-[11px]">SIM MODE</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
