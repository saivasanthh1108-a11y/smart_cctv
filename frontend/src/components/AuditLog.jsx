import React, { useState } from 'react';
import { History, Download, Trash2, Filter, Search, CheckCircle, AlertTriangle, ShieldAlert, Cpu, Radio } from 'lucide-react';

export default function AuditLog({ logs, onClearLogs }) {
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'ALL' || log.category === filter;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.timestamp.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const exportLogsAsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `corridor_audit_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'CORRIDOR':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">CORRIDOR</span>;
      case 'DISPATCH':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">DISPATCH</span>;
      case 'POLICE_OVERRIDE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">OVERRIDE</span>;
      case 'AI_VISION':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">AI VISION</span>;
      case 'JUNCTION':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">JUNCTION</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">SYSTEM</span>;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono">Immutable Incident Audit Log</h2>
              <span className="text-[11px] text-slate-400">Chronological Event & Telemetry Trail</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportLogsAsJSON}
              title="Export Audit Log (JSON)"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono text-[11px]">Export</span>
            </button>
            <button
              onClick={onClearLogs}
              title="Clear Log"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/60 border border-slate-700 hover:border-red-800/80 text-slate-400 hover:text-red-300 text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter bar & search */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
            {['ALL', 'CORRIDOR', 'DISPATCH', 'POLICE_OVERRIDE', 'AI_VISION', 'JUNCTION'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors border ${
                  filter === cat
                    ? 'bg-emerald-950 border-emerald-500/80 text-emerald-300 font-bold'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative text-xs w-full sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 pl-7 pr-2 py-1 rounded-lg text-slate-200 text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
            />
          </div>
        </div>

        {/* Log Entries Container */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              No audit entries matching filter criteria.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div
                key={log.id}
                className="bg-slate-900/80 rounded-lg p-2 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-start justify-between gap-2 text-xs"
              >
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                    {log.timestamp}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {getCategoryBadge(log.category)}
                    </div>
                    <span className="text-slate-200 text-[11px] leading-snug">{log.message}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>Logged Actions: {logs.length} Total</span>
        <span className="text-emerald-400 font-semibold">ISO 27001 / V2X Audit Compliant</span>
      </div>
    </div>
  );
}
