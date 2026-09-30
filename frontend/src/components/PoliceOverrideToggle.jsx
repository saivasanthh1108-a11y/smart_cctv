import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Lock, Unlock, Radio, UserCheck, Flame } from 'lucide-react';
import { soundFx } from '../utils/audio';

export default function PoliceOverrideToggle({
  isPoliceOverride,
  onToggleOverride,
  soundEnabled
}) {
  const [badgeId, setBadgeId] = useState('OFFICER-4492 (Metro HWP)');
  const [overrideReason, setOverrideReason] = useState('Corridor Priority Clear - High Threat In-Transit');

  const handleToggle = () => {
    const newState = !isPoliceOverride;
    if (newState && soundEnabled) {
      soundFx.playOverrideAlarm();
    }
    onToggleOverride(newState, badgeId, overrideReason);
  };

  return (
    <div className={`rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between ${
      isPoliceOverride
        ? 'glass-panel-danger border-red-500/80 shadow-2xl shadow-red-950/60'
        : 'glass-panel border-slate-800'
    }`}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${
              isPoliceOverride 
                ? 'bg-red-900/60 border-red-400 text-red-300 animate-bounce' 
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono">Police Emergency Override</h2>
              <span className="text-[11px] text-slate-400">Jurisdiction Manual Signal Preemption Unit</span>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
            isPoliceOverride
              ? 'bg-red-900 border border-red-500 text-red-200 animate-pulse'
              : 'bg-slate-800 border border-slate-700 text-slate-400'
          }`}>
            {isPoliceOverride ? 'OVERRIDE ENGAGED' : 'AI ADAPTIVE MODE'}
          </span>
        </div>

        {/* Override Strobe Banner when active */}
        {isPoliceOverride && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/90 border border-red-500/80 text-red-200 flex items-center gap-3 animate-pulse">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <div className="text-xs font-bold font-mono tracking-wider">ALL 5 JUNCTIONS LOCKED GREEN</div>
              <div className="text-[11px] text-red-300/90">Standard signal timing suspended. Cross-traffic held at red phase.</div>
            </div>
          </div>
        )}

        {/* Toggle Switch Component */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              {isPoliceOverride ? <Lock className="w-4 h-4 text-red-400" /> : <Unlock className="w-4 h-4 text-slate-400" />}
              <span>Manual Signal Lockout</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isPoliceOverride
                ? 'Authorized by Highway Patrol. Disengage to resume AI green wave.'
                : 'Instantly forces all corridor signals to green phase unconditionally.'}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
            <input
              type="checkbox"
              checked={isPoliceOverride}
              onChange={handleToggle}
              className="sr-only peer"
            />
            <div className="w-14 h-8 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600 peer-checked:shadow-lg peer-checked:shadow-red-600/50"></div>
          </label>
        </div>

        {/* Authorization inputs */}
        <div className="space-y-2 text-xs font-mono">
          <div>
            <label className="block text-[10px] uppercase text-slate-400 mb-1">Authorizing Unit / Officer ID:</label>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={badgeId}
                onChange={(e) => setBadgeId(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xs text-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Radio className="w-3 h-3 text-slate-400" />
          V2X Protocol: DSRC / 5G NR
        </span>
        <span className={isPoliceOverride ? 'text-red-400 font-bold' : 'text-slate-500'}>
          Fail-Safe: Auto-Revert (10 min max)
        </span>
      </div>
    </div>
  );
}
