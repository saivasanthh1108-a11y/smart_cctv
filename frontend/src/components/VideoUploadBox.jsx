import React, { useState, useRef } from 'react';
import { UploadCloud, Video, AlertCircle, CheckCircle, Eye, RefreshCw, Cpu, Layers, Sparkles } from 'lucide-react';
import { analyzeVideo } from '../api';
import { MOCK_DETECTED_EVENTS } from '../data/mockData';

export default function VideoUploadBox({ onEventsDetected, addAuditLog }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedEvents, setDetectedEvents] = useState(MOCK_DETECTED_EVENTS);
  const [lastSource, setLastSource] = useState('Default Model');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    runAnalysis(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const runAnalysis = async (targetFile) => {
    setAnalyzing(true);
    addAuditLog?.('AI_VISION', `Dispatching video stream analysis to /analyze-video for ${targetFile?.name || 'CCTV Feed'}`);

    try {
      const result = await analyzeVideo(targetFile);
      setDetectedEvents(result.events || MOCK_DETECTED_EVENTS);
      setLastSource(result.source === 'backend' ? 'FastAPI :8000' : 'Aegis Vision Neural Net (Sim)');
      onEventsDetected?.(result.events || MOCK_DETECTED_EVENTS);
      addAuditLog?.('AI_VISION', `Video analysis completed: ${result.events?.length || 5} traffic events detected`);
    } catch (err) {
      console.error('Video analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSimulateSample = () => {
    const mockFile = new File(['mock sample video data'], 'traffic_cctv_junction3_cam.mp4', { type: 'video/mp4' });
    setFile(mockFile);
    setPreviewUrl(null);
    runAnalysis(mockFile);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-950/60 border border-teal-500/40 text-teal-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono">Edge AI Video Analytics</h2>
              <span className="text-[11px] text-slate-400">Computer Vision Stream & Preemption Engine (/analyze-video)</span>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-teal-800/40">
            Source: {lastSource}
          </span>
        </div>

        {/* Upload Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all relative overflow-hidden mb-4 ${
            isDragging
              ? 'border-teal-400 bg-teal-950/30'
              : 'border-slate-700 bg-slate-900/60 hover:border-teal-500/60 hover:bg-slate-900'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />

          {previewUrl ? (
            <div className="space-y-2">
              <video
                src={previewUrl}
                controls
                className="max-h-36 mx-auto rounded-lg shadow-md border border-slate-700"
              />
              <div className="text-xs text-slate-300 font-mono truncate">{file?.name}</div>
            </div>
          ) : (
            <div className="py-2">
              <div className="mx-auto w-10 h-10 rounded-full bg-teal-950/70 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                Drop CCTV feed or Dashcam video here
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Calls <code className="text-teal-400 font-mono">POST /analyze-video</code> for vehicle & siren detection
              </p>
            </div>
          )}

          {analyzing && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <div className="relative">
                <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
                <Sparkles className="w-4 h-4 text-teal-300 absolute -top-1 -right-1" />
              </div>
              <span className="text-xs font-mono font-bold text-teal-300 tracking-wider">
                ANALYZING FRAMES WITH NEURAL NET...
              </span>
              <span className="text-[10px] text-slate-400">Classifying vehicle velocity, siren audio, & cross-traffic</span>
            </div>
          )}
        </div>

        {/* Action button to load sample feed */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
            Detected Events ({detectedEvents.length}):
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); handleSimulateSample(); }}
            disabled={analyzing}
            className="text-[11px] font-mono text-teal-400 hover:text-teal-300 flex items-center gap-1 hover:underline"
          >
            <Video className="w-3.5 h-3.5" />
            Analyze Sample CCTV Feed
          </button>
        </div>

        {/* Detected Events List */}
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {detectedEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-start justify-between gap-2 text-xs"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {evt.severity === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : evt.severity === 'warning' ? (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Eye className="w-4 h-4 text-teal-400 shrink-0" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-100">{evt.label}</span>
                    {evt.junction && (
                      <span className="font-mono text-[9px] px-1 rounded bg-slate-800 text-teal-300 border border-slate-700">
                        {evt.junction}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{evt.detail}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-[10px] text-emerald-400 font-bold block">
                  {(evt.confidence * 100).toFixed(1)}%
                </span>
                <span className="font-mono text-[9px] text-slate-400 block">{evt.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>YOLOv8 + C-V2X Telemetry Model</span>
        <span className="text-emerald-400 font-semibold">Latency: ~22ms</span>
      </div>
    </div>
  );
}
