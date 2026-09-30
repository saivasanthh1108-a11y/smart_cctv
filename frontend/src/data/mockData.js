// Initial data and presets for the AegisCorridor system

export const INITIAL_JUNCTIONS = [
  {
    id: 'J1',
    name: 'J1 - Central Avenue & 1st St',
    coords: [40.7128, -74.0060],
    defaultPhase: 'RED',
    phase: 'RED',
    congestion: 'Medium (64%)',
    queueLength: 12,
    timeSavedSec: 0,
    lockedGreen: false,
    speedLimit: '50 km/h'
  },
  {
    id: 'J2',
    name: 'J2 - University Parkway & 5th Ave',
    coords: [40.7180, -73.9990],
    defaultPhase: 'YELLOW',
    phase: 'YELLOW',
    congestion: 'High (82%)',
    queueLength: 21,
    timeSavedSec: 0,
    lockedGreen: false,
    speedLimit: '50 km/h'
  },
  {
    id: 'J3',
    name: 'J3 - Metro Plaza & Grand Blvd',
    coords: [40.7245, -73.9920],
    defaultPhase: 'RED',
    phase: 'RED',
    congestion: 'Heavy (91%)',
    queueLength: 29,
    timeSavedSec: 0,
    lockedGreen: false,
    speedLimit: '45 km/h'
  },
  {
    id: 'J4',
    name: 'J4 - Riverside Bridge Corridor',
    coords: [40.7310, -73.9850],
    defaultPhase: 'GREEN',
    phase: 'GREEN',
    congestion: 'Low (38%)',
    queueLength: 7,
    timeSavedSec: 0,
    lockedGreen: false,
    speedLimit: '60 km/h'
  },
  {
    id: 'J5',
    name: 'J5 - Medical Center Expressway Crossing',
    coords: [40.7380, -73.9780],
    defaultPhase: 'RED',
    phase: 'RED',
    congestion: 'Medium (55%)',
    queueLength: 14,
    timeSavedSec: 0,
    lockedGreen: false,
    speedLimit: '50 km/h'
  }
];

export const HOSPITAL_LOCATION = {
  id: 'HOSP_01',
  name: 'Apex City Trauma & General Hospital',
  coords: [40.7435, -73.9720],
  address: '550 1st Avenue, New York, NY 10016',
  level: 'Level 1 Trauma Center',
  traumaBaysAvailable: 2,
  icuBedsAvailable: 4,
  bloodBankStatus: 'Normal (O-Neg: 8 units reserved)',
  onDutyLead: 'Dr. Rachel Vance, MD (Chief of Trauma)'
};

export const AMBULANCE_START = {
  id: 'MED-402',
  callsign: 'Apex Medic-402',
  type: 'Advanced Life Support (ALS) Ambulance',
  coords: [40.7085, -74.0110],
  speedKmh: 68,
  driver: 'Officer J. Ramos / Paramedic K. Liu'
};

export const DEFAULT_SIMULATION_RESULTS = [
  {
    mode: 'None (Baseline)',
    key: 'none',
    responseTimeMin: 15.4,
    junctionWaitSec: 340,
    avgSpeedKmh: 24.5,
    fuelDelayIndex: 82,
    color: '#EF4444'
  },
  {
    mode: 'Reactive',
    key: 'reactive',
    responseTimeMin: 9.2,
    junctionWaitSec: 155,
    avgSpeedKmh: 42.0,
    fuelDelayIndex: 44,
    color: '#F59E0B'
  },
  {
    mode: 'Predictive (AI Wave)',
    key: 'predictive',
    responseTimeMin: 4.1,
    junctionWaitSec: 18,
    avgSpeedKmh: 68.4,
    fuelDelayIndex: 12,
    color: '#10B981'
  }
];

export const INCIDENT_PRESETS = [
  {
    id: 'INC-8942-ALPHA',
    title: 'Acute ST-Elevation Myocardial Infarction (STEMI)',
    severity: 'CRITICAL',
    patient: 'Male, 58 yrs | Severe Chest Angina, Vitals Dropping',
    origin: '742 Evergreen Terrace (Downtown Sector 3)',
    destination: 'Apex Trauma & General Hospital (Cath Lab Ready)',
    vitals: { hr: 128, bp: '88/56', spo2: 91, rr: 24, temp: 37.1 }
  },
  {
    id: 'INC-7721-BRAVO',
    title: 'High-Velocity Multi-Vehicle Collision (Trauma Alpha)',
    severity: 'CRITICAL',
    patient: 'Female, 31 yrs | Polytrauma, Suspected Hemothorax',
    origin: 'Interstate 495 Mile Marker 12',
    destination: 'Apex Trauma Center (OR #2 Reserved)',
    vitals: { hr: 138, bp: '82/50', spo2: 88, rr: 28, temp: 36.4 }
  },
  {
    id: 'INC-6204-CHARLIE',
    title: 'Pediatric Status Epilepticus',
    severity: 'HIGH',
    patient: 'Child, 6 yrs | Continuous Tonic-Clonic Seizures',
    origin: '104 Roosevelt Elementary Way',
    destination: 'Apex Pediatric Intensive Care',
    vitals: { hr: 144, bp: '102/68', spo2: 94, rr: 26, temp: 38.9 }
  }
];

export const MOCK_DETECTED_EVENTS = [
  {
    id: 'evt-1',
    time: '00:02.14',
    type: 'AMBULANCE_IDENTIFIED',
    label: 'Emergency Vehicle Detected',
    detail: 'ALS Medic-402 recognized via optical siren signature & transponder ID',
    confidence: 0.984,
    junction: 'J1',
    severity: 'success'
  },
  {
    id: 'evt-2',
    time: '00:03.88',
    type: 'OBSTRUCTION_DETECTED',
    label: 'Intersection Congestion Wave',
    detail: 'Left-turn queue extending into clear corridor path; preemptive clearance issued',
    confidence: 0.941,
    junction: 'J2',
    severity: 'warning'
  },
  {
    id: 'evt-3',
    time: '00:06.12',
    type: 'SIGNAL_PREEMPTION',
    label: 'Northbound Corridor Signal Preempted',
    detail: 'Phase forced to Green with 45s safety hold buffer',
    confidence: 0.992,
    junction: 'J3',
    severity: 'success'
  },
  {
    id: 'evt-4',
    time: '00:08.50',
    type: 'PEDESTRIAN_YIELD',
    label: 'Crosswalk Clearance Confirmed',
    detail: 'Crosswalk audio alert triggered; pedestrians cleared to sidewalk safety zone',
    confidence: 0.967,
    junction: 'J4',
    severity: 'info'
  },
  {
    id: 'evt-5',
    time: '00:11.20',
    type: 'LANE_CLEARED',
    label: 'Corridor Lane Yield Verified',
    detail: 'Vehicles shifted to right shoulder; corridor velocity maintained at 65 km/h',
    confidence: 0.978,
    junction: 'J5',
    severity: 'success'
  }
];
