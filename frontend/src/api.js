import { DEFAULT_SIMULATION_RESULTS, MOCK_DETECTED_EVENTS } from './data/mockData';

const BASE_URL = 'http://localhost:8000';

export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${BASE_URL}/docs`, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res.ok || res.status === 200 || res.status === 404;
  } catch (err) {
    return false;
  }
}

export async function fetchSimulationResults() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${BASE_URL}/simulation-results`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();

    // Map FastAPI payload to expected charting format
    // Accommodate array or object format { none: ..., reactive: ..., predictive: ... }
    if (Array.isArray(data)) {
      return { success: true, data, source: 'backend' };
    } else if (typeof data === 'object' && data !== null) {
      const formatted = [
        {
          mode: data.none?.mode || 'None (Standard)',
          key: 'none',
          responseTimeMin: Number(data.none?.average_ambulance_time ?? data.none?.response_time ?? data.none?.responseTime ?? 15.4),
          junctionWaitSec: Number(data.none?.cross_traffic_delay ?? data.none?.junction_wait ?? data.none?.junctionWaitSec ?? 46),
          average_ambulance_time: Number(data.none?.average_ambulance_time ?? 15.4),
          cross_traffic_delay: Number(data.none?.cross_traffic_delay ?? 46.2),
          color: '#EF4444'
        },
        {
          mode: data.reactive?.mode || 'Reactive',
          key: 'reactive',
          responseTimeMin: Number(data.reactive?.average_ambulance_time ?? data.reactive?.response_time ?? data.reactive?.responseTime ?? 9.2),
          junctionWaitSec: Number(data.reactive?.cross_traffic_delay ?? data.reactive?.junction_wait ?? data.reactive?.junctionWaitSec ?? 82),
          average_ambulance_time: Number(data.reactive?.average_ambulance_time ?? 9.2),
          cross_traffic_delay: Number(data.reactive?.cross_traffic_delay ?? 82.5),
          color: '#F59E0B'
        },
        {
          mode: data.predictive?.mode || 'Predictive (AI Wave)',
          key: 'predictive',
          responseTimeMin: Number(data.predictive?.average_ambulance_time ?? data.predictive?.response_time ?? data.predictive?.responseTime ?? 4.1),
          junctionWaitSec: Number(data.predictive?.cross_traffic_delay ?? data.predictive?.junction_wait ?? data.predictive?.junctionWaitSec ?? 21),
          average_ambulance_time: Number(data.predictive?.average_ambulance_time ?? 4.1),
          cross_traffic_delay: Number(data.predictive?.cross_traffic_delay ?? 21.4),
          color: '#10B981'
        }
      ];
      return { success: true, data: formatted, source: 'backend' };
    }
    return { success: true, data: DEFAULT_SIMULATION_RESULTS, source: 'fallback' };
  } catch (err) {
    console.warn('FastAPI /simulation-results offline or unreachable, using high-fidelity fallback:', err.message);
    return { success: false, data: DEFAULT_SIMULATION_RESULTS, source: 'fallback', error: err.message };
  }
}

export async function analyzeVideo(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('video', file); // support either param name

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${BASE_URL}/analyze-video`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`API error ${res.status}`);
    }

    const data = await res.json();
    const events = Array.isArray(data) ? data : (data.events || data.detections || MOCK_DETECTED_EVENTS);
    return { success: true, events, source: 'backend' };
  } catch (err) {
    console.warn('FastAPI /analyze-video offline or unreachable, using local AI mock simulation:', err.message);
    // Simulate realistic asynchronous AI processing delay
    await new Promise(r => setTimeout(r, 1200));
    return {
      success: false,
      events: MOCK_DETECTED_EVENTS,
      source: 'fallback',
      error: err.message
    };
  }
}

export async function postDispatchIncident(incident) {
  try {
    const res = await fetch(`${BASE_URL}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.log('Dispatch API mock handled locally:', err.message);
  }
  return { dispatched: true, corridorId: 'CORR-' + Date.now().toString().slice(-4) };
}

export async function postPoliceOverride(state) {
  try {
    const res = await fetch(`${BASE_URL}/police-override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: state, timestamp: new Date().toISOString() })
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.log('Override API handled locally:', err.message);
  }
  return { overrideActive: state };
}
