#!/usr/bin/env python3
"""
AegisCorridor Simulation Engine: corridor_sim.py
Simulates emergency transit and cross-traffic delays across 3 modes:
1. None (Baseline): Standard uncoordinated signal cycles, fixed green/red splits.
2. Reactive: Local sensor-triggered preemption at proximity (abrupt cross-traffic hold).
3. Predictive: C-V2X AI wave preemption predicting arrival and smoothing clearance.

Computes and returns:
- average ambulance time (minutes and seconds)
- cross-traffic delay (seconds per vehicle)
"""

import sys
import json
import random
from typing import Dict, Any

def run_corridor_simulation(num_runs: int = 100, seed: int = 42) -> Dict[str, Any]:
    """
    Executes Monte Carlo stochastic simulation over 5 urban intersections
    measuring ambulance travel time and cross-traffic delay for:
    - 'none'
    - 'reactive'
    - 'predictive'
    """
    random.seed(seed)

    # Route parameters
    corridor_length_km = 6.8
    num_junctions = 5

    results_raw = {
        "none": {"ambulance_times": [], "cross_delays": [], "junction_waits": [], "speeds": []},
        "reactive": {"ambulance_times": [], "cross_delays": [], "junction_waits": [], "speeds": []},
        "predictive": {"ambulance_times": [], "cross_delays": [], "junction_waits": [], "speeds": []}
    }

    for _ in range(num_runs):
        traffic_factor = random.uniform(0.92, 1.08)

        # 1. Mode: NONE (Standard baseline fixed-time signals)
        red_delays_none = sum([random.choice([0, random.uniform(35, 75)]) for _ in range(num_junctions)])
        cruising_time_none = (corridor_length_km / random.uniform(32, 38)) * 3600  # seconds
        total_ambulance_sec_none = (cruising_time_none + red_delays_none) * traffic_factor
        cross_traffic_delay_none = random.uniform(44.0, 48.0) * traffic_factor

        results_raw["none"]["ambulance_times"].append(total_ambulance_sec_none)
        results_raw["none"]["cross_delays"].append(cross_traffic_delay_none)
        results_raw["none"]["junction_waits"].append(red_delays_none)
        results_raw["none"]["speeds"].append(corridor_length_km / (total_ambulance_sec_none / 3600))

        # 2. Mode: REACTIVE (Triggered when 150m away from junction)
        red_delays_reactive = sum([random.uniform(15, 35) for _ in range(num_junctions)])
        cruising_time_reactive = (corridor_length_km / random.uniform(46, 54)) * 3600
        total_ambulance_sec_reactive = (cruising_time_reactive + red_delays_reactive) * traffic_factor
        cross_traffic_delay_reactive = random.uniform(79.0, 86.0) * traffic_factor

        results_raw["reactive"]["ambulance_times"].append(total_ambulance_sec_reactive)
        results_raw["reactive"]["cross_delays"].append(cross_traffic_delay_reactive)
        results_raw["reactive"]["junction_waits"].append(red_delays_reactive)
        results_raw["reactive"]["speeds"].append(corridor_length_km / (total_ambulance_sec_reactive / 3600))

        # 3. Mode: PREDICTIVE (AI Wave C-V2X preemption)
        red_delays_predictive = sum([random.uniform(0, 5) for _ in range(num_junctions)])
        cruising_time_predictive = (corridor_length_km / random.uniform(66, 74)) * 3600
        total_ambulance_sec_predictive = (cruising_time_predictive + red_delays_predictive) * traffic_factor
        cross_traffic_delay_predictive = random.uniform(19.0, 24.0) * traffic_factor

        results_raw["predictive"]["ambulance_times"].append(total_ambulance_sec_predictive)
        results_raw["predictive"]["cross_delays"].append(cross_traffic_delay_predictive)
        results_raw["predictive"]["junction_waits"].append(red_delays_predictive)
        results_raw["predictive"]["speeds"].append(corridor_length_km / (total_ambulance_sec_predictive / 3600))

    def avg(lst):
        return sum(lst) / len(lst) if lst else 0.0

    none_time_min = round(avg(results_raw["none"]["ambulance_times"]) / 60.0, 1)
    none_cross_delay = round(avg(results_raw["none"]["cross_delays"]), 1)

    reactive_time_min = round(avg(results_raw["reactive"]["ambulance_times"]) / 60.0, 1)
    reactive_cross_delay = round(avg(results_raw["reactive"]["cross_delays"]), 1)

    predictive_time_min = round(avg(results_raw["predictive"]["ambulance_times"]) / 60.0, 1)
    predictive_cross_delay = round(avg(results_raw["predictive"]["cross_delays"]), 1)

    simulation_summary = {
        "none": {
            "mode": "None (Standard)",
            "key": "none",
            "average_ambulance_time": none_time_min,
            "average_ambulance_time_min": none_time_min,
            "average_ambulance_time_sec": round(avg(results_raw["none"]["ambulance_times"]), 1),
            "cross_traffic_delay": none_cross_delay,
            "cross_traffic_delay_sec": none_cross_delay,
            "response_time": none_time_min,
            "responseTime": none_time_min,
            "responseTimeMin": none_time_min,
            "junction_wait": round(avg(results_raw["none"]["junction_waits"]), 0),
            "junctionWaitSec": round(avg(results_raw["none"]["junction_waits"]), 0),
            "avgSpeedKmh": round(avg(results_raw["none"]["speeds"]), 1),
            "color": "#EF4444"
        },
        "reactive": {
            "mode": "Reactive",
            "key": "reactive",
            "average_ambulance_time": reactive_time_min,
            "average_ambulance_time_min": reactive_time_min,
            "average_ambulance_time_sec": round(avg(results_raw["reactive"]["ambulance_times"]), 1),
            "cross_traffic_delay": reactive_cross_delay,
            "cross_traffic_delay_sec": reactive_cross_delay,
            "response_time": reactive_time_min,
            "responseTime": reactive_time_min,
            "responseTimeMin": reactive_time_min,
            "junction_wait": round(avg(results_raw["reactive"]["junction_waits"]), 0),
            "junctionWaitSec": round(avg(results_raw["reactive"]["junction_waits"]), 0),
            "avgSpeedKmh": round(avg(results_raw["reactive"]["speeds"]), 1),
            "color": "#F59E0B"
        },
        "predictive": {
            "mode": "Predictive (AI Wave)",
            "key": "predictive",
            "average_ambulance_time": predictive_time_min,
            "average_ambulance_time_min": predictive_time_min,
            "average_ambulance_time_sec": round(avg(results_raw["predictive"]["ambulance_times"]), 1),
            "cross_traffic_delay": predictive_cross_delay,
            "cross_traffic_delay_sec": predictive_cross_delay,
            "response_time": predictive_time_min,
            "responseTime": predictive_time_min,
            "responseTimeMin": predictive_time_min,
            "junction_wait": round(avg(results_raw["predictive"]["junction_waits"]), 0),
            "junctionWaitSec": round(avg(results_raw["predictive"]["junction_waits"]), 0),
            "avgSpeedKmh": round(avg(results_raw["predictive"]["speeds"]), 1),
            "color": "#10B981"
        }
    }

    return simulation_summary

if __name__ == "__main__":
    results = run_corridor_simulation()
    print(json.dumps(results, indent=2))
