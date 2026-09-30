#!/usr/bin/env python3
import os
import sys

# Ensure parent and current directory are in sys.path
root_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from eval_video import main

if __name__ == "__main__":
    main()
