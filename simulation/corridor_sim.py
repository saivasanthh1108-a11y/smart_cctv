#!/usr/bin/env python3
import sys
import os

# Ensure backend directory is in python path
backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from simulation.corridor_sim import run_corridor_simulation

if __name__ == "__main__":
    import json
    res = run_corridor_simulation()
    print(json.dumps(res, indent=2))
