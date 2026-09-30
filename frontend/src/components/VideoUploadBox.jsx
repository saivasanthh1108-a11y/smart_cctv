import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Video,
  AlertCircle,
  CheckCircle,
  Eye,
  RefreshCw,
  Cpu,
  Volume2,
  Activity,
  Sparkles,
  Zap,
  Sliders
} from 'lucide-react';
import { analyzeVideo, analyzeAudio } from '../api';
import { MOCK_DETECTED_EVENTS } from '../data/mockData';

export default function VideoUploadBox({ onEventsDetected, addAuditLog }) {
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'audio'
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedEvents, setDetectedEvents] = useState(MOCK_DETECTED_EVENTS);
  const [lastSource, setLastSource] = useState('Default Model');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Audio & Fusion state
  const [audioResult, setAudioResult] = useState({
    processed_file: 'sample_siren_screech.wav',
    audio_scores: { siren_score: 0.942, crash_score: 0.884, siren_detected: true, crash_detected: true },
    fusion: {
      active_modality: 'emergency_siren',
      fused_score: 0.932,
      threshold_met: true,
      decision: 'CRITICAL_ACTION_REQUIRED',
      severity: 'CRITICAL',
      formula: 'F = min(1.0, 0.55 * Sv (0.94) + 0.35 * Sa (0.94) + 0.10 * sqrt(Sv*Sa)) = 0.932',
      breakdown: { vision_term: 0.517, audio_term: 0.330, synergy_term: 0.085 }
    },
    top_classes: [
      { class: 'Ambulance (siren)', score: 0.942 },
      { class: 'Emergency vehicle', score: 0.895 },
      { class: 'Tire squeal / Screech', score: 0.884 }
    ],
    corridor_preemption_active: true
  });

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    if (activeTab === 'video') {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      runVideoAnalysis(selectedFile);
    } else {
      setPreviewUrl(null);
      runAudioAnalysis(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const runVideoAnalysis = async (targetFile) => {
    setAnalyzing(true);
    addAuditLog?.('AI_VISION', `Dispatching video stream analysis to /analyze-video for ${targetFile?.name || 'CCTV Feed'}`);

    try {
      const result = await analyzeVideo(targetFile);
      setDetectedEvents(result.events || MOCK_DETECTED_EVENTS);
      setLastSource(result.source === 'backend' ? 'FastAPI :8000 (YOLOv8)' : 'Aegis Vision Neural Net (Sim)');
      onEventsDetected?.(result.events || MOCK_DETECTED_EVENTS);
      addAuditLog?.('AI_VISION', `Video analysis completed: ${result.events?.length || 5} traffic events detected`);
    } catch (err) {
      console.error('Video analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const runAudioAnalysis = async (targetFile, presetModality = 'auto') => {
    setAnalyzing(true);
    addAuditLog?.('AI_AUDIO', `Streaming WAV audio to /analyze-audio (TensorFlow Hub YAMNet) for ${targetFile?.name || 'Audio Feed'}`);

    try {
      const result = await analyzeAudio(targetFile, {
        visionScore: 0.94,
        modality: presetModality,
        junction: 'J2'
      });
      if (result.data) {
        setAudioResult(result.data);
      }
      setLastSource(result.source === 'backend' ? 'FastAPI :8000 (YAMNet)' : 'TensorFlow Hub YAMNet (Sim)');
      addAuditLog?.('AI_AUDIO', `YAMNet Audio Score: Siren ${(result.data?.audio_scores?.siren_score * 100).toFixed(0)}%, Crash ${(result.data?.audio_scores?.crash_score * 100).toFixed(0)}% | Fused: ${(result.data?.fusion?.fused_score * 100).toFixed(1)}%`);
    } catch (err) {
      console.error('Audio analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSimulateSample = () => {
    if (activeTab === 'video') {
      const mockFile = new File(['mock sample video data'], 'traffic_cctv_junction3_cam.mp4', { type: 'video/mp4' });
      setFile(mockFile);
      setPreviewUrl(null);
      runVideoAnalysis(mockFile);
    } else {
      const mockFile = new File(['mock siren wave audio'], 'ambulance_siren_emergency.wav', { type: 'audio/wav' });
      setFile(mockFile);
      runAudioAnalysis(mockFile, 'emergency_siren');
    }
  };

  const handleSimulateCrashAudio = () => {
    const mockCrash = new File(['mock collision screech audio'], 'intersection_crash_screech.wav', { type: 'audio/wav' });
    setFile(mockCrash);
    runAudioAnalysis(mockCrash, 'accident');
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between h-full">
      <div>
        {/* Header with Mode Switcher */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border text-white ${
              activeTab === 'video'
                ? 'bg-teal-950/70 border-teal-500/40 text-teal-400'
                : 'bg-indigo-950/70 border-indigo-500/40 text-indigo-400'
            }`}>
              {activeTab === 'video' ? <Cpu className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                {activeTab === 'video' ? 'Edge AI Video Analytics' : 'YAMNet Audio & Fusion AI'}
              </h2>
              <span className="text-[11px] text-slate-400">
                {activeTab === 'video'
                  ? 'YOLOv8 ByteTrack Overlap Rule (/analyze-video)'
                  : 'TensorFlow Hub YAMNet & Fusion Formula (/analyze-audio)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('video')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1 ${
                activeTab === 'video'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3 h-3" />
              Vision
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1 ${
                activeTab === 'audio'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Volume2 className="w-3 h-3" />
              Audio (YAMNet)
            </button>
          </div>
        </div>

        {/* Upload Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-3.5 text-center transition-all relative overflow-hidden mb-3 ${
            isDragging
              ? activeTab === 'video' ? 'border-teal-400 bg-teal-950/30' : 'border-indigo-400 bg-indigo-950/30'
              : 'border-slate-700 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={activeTab === 'video' ? 'video/*' : 'audio/*,.wav,.mp3'}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />

          {previewUrl && activeTab === 'video' ? (
            <div className="space-y-1.5">
              <video
                src={previewUrl}
                controls
                className="max-h-32 mx-auto rounded-lg shadow-md border border-slate-700"
              />
              <div className="text-[11px] text-slate-300 font-mono truncate">{file?.name}</div>
            </div>
          ) : (
            <div className="py-1">
              <div className={`mx-auto w-9 h-9 rounded-full border flex items-center justify-center mb-1.5 ${
                activeTab === 'video'
                  ? 'bg-teal-950/70 border-teal-500/30 text-teal-400'
                  : 'bg-indigo-950/70 border-indigo-500/30 text-indigo-400'
              }`}>
                {activeTab === 'video' ? <UploadCloud className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </div>
              <p className="text-xs font-semibold text-slate-200">
                {activeTab === 'video'
                  ? 'Drop CCTV feed or Dashcam video here'
                  : 'Drop WAV audio or Siren/Crash recording here'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {activeTab === 'video'
                  ? 'Calls POST /analyze-video for YOLOv8 overlap-and-stopped rule'
                  : 'Calls POST /analyze-audio for YAMNet siren & crash score fusion'}
              </p>
            </div>
          )}

          {analyzing && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5">
              <div className="relative">
                <RefreshCw className="w-7 h-7 text-teal-400 animate-spin" />
                <Sparkles className="w-3.5 h-3.5 text-teal-300 absolute -top-1 -right-1" />
              </div>
              <span className="text-xs font-mono font-bold text-teal-300 tracking-wider">
                {activeTab === 'video' ? 'INFERRING YOLOv8 FRAMES...' : 'PROCESSING YAMNet TF HUB CLASSIFIER...'}
              </span>
              <span className="text-[10px] text-slate-400">
                {activeTab === 'video'
                  ? 'Tracking vehicle velocity & overlap'
                  : 'Computing Siren & Crash 0-1 scores & Sensor Fusion'}
              </span>
            </div>
          )}
        </div>

        {/* Tab 1: Video Results */}
        {activeTab === 'video' && (
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                Detected Events ({detectedEvents.length}):
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleSimulateSample(); }}
                disabled={analyzing}
                className="text-[11px] font-mono text-teal-400 hover:text-teal-300 flex items-center gap-1 hover:underline"
              >
                <Video className="w-3 h-3" />
                Analyze Sample CCTV Feed
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {detectedEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-slate-900/90 rounded-lg p-2 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-start justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {evt.severity === 'success' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : evt.severity === 'warning' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-100 text-[11px]">{evt.label}</span>
                        {evt.junction && (
                          <span className="font-mono text-[9px] px-1 rounded bg-slate-800 text-teal-300 border border-slate-700">
                            {evt.junction}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-300 mt-0.5 leading-tight">{evt.detail}</p>
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
        )}

        {/* Tab 2: Audio & Multimodal Fusion Results */}
        {activeTab === 'audio' && (
          <div className="space-y-2.5">
            {/* Action buttons for quick test */}
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-400">Quick Test WAV:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSimulateSample}
                  disabled={analyzing}
                  className="px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-500/40 text-[10px] font-mono text-indigo-300 hover:bg-indigo-900/80 flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3 text-indigo-400" />
                  Siren WAV
                </button>
                <button
                  onClick={handleSimulateCrashAudio}
                  disabled={analyzing}
                  className="px-2 py-0.5 rounded bg-rose-950/70 border border-rose-500/40 text-[10px] font-mono text-rose-300 hover:bg-rose-900/80 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  Crash Screech WAV
                </button>
              </div>
            </div>

            {/* Audio 0 to 1 Scores Gauges */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              {/* Siren Score */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-mono font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Siren / Emerg.
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {(audioResult.audio_scores?.siren_score ?? 0.94).toFixed(3)}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (audioResult.audio_scores?.siren_score ?? 0.94) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Crash / Screech Score */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-mono font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    Crash / Screech
                  </span>
                  <span className="font-mono font-bold text-rose-400">
                    {(audioResult.audio_scores?.crash_score ?? 0.88).toFixed(3)}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-rose-500 to-rose-400 h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (audioResult.audio_scores?.crash_score ?? 0.88) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Multimodal Fusion Formula Card */}
            <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-teal-950/40 p-2.5 rounded-xl border border-indigo-500/30">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-bold text-white font-mono uppercase tracking-wide">
                    Multimodal Fusion Score
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  {audioResult.fusion?.decision || 'CRITICAL_ACTION'}
                </span>
              </div>

              {/* Fused Score Bar */}
              <div className="flex items-center gap-3 mb-1.5">
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {((audioResult.fusion?.fused_score ?? 0.932) * 100).toFixed(1)}%
                </div>
                <div className="flex-1">
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 via-indigo-500 to-emerald-400 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (audioResult.fusion?.fused_score ?? 0.932) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5">
                    <span>Threshold: 0.700</span>
                    <span className="text-emerald-400">Preemption Active</span>
                  </div>
                </div>
              </div>

              {/* Fusion Formula Display */}
              <div className="bg-slate-950/60 rounded p-1.5 font-mono text-[9px] text-teal-300 border border-slate-800 truncate">
                {audioResult.fusion?.formula || 'F = min(1.0, 0.55*Sv + 0.35*Sa + 0.10*sqrt(Sv*Sa))'}
              </div>
            </div>

            {/* Top YAMNet AudioSet Classes */}
            {audioResult.top_classes && audioResult.top_classes.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] font-mono uppercase text-slate-400">Top AudioSet Predictions:</span>
                <div className="flex flex-wrap gap-1">
                  {audioResult.top_classes.map((cls, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center gap-1"
                    >
                      <span>{cls.class}</span>
                      <span className="text-indigo-400 font-bold">{(cls.score * 100).toFixed(0)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>{activeTab === 'video' ? 'YOLOv8 + ByteTrack' : 'YAMNet (TF Hub) + Multimodal Fusion'}</span>
        <span className="text-emerald-400 font-semibold">
          {activeTab === 'video' ? 'Latency: ~22ms' : 'Fusion Engine: Active'}
        </span>
      </div>
    </div>
  );
}
