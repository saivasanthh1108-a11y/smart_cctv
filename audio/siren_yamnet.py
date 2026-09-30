import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from backend.audio.siren_yamnet import *
except ImportError:
    # If invoked directly with backend in path
    from audio.siren_yamnet import *

if __name__ == "__main__":
    import json
    # Run test
    test_file = sys.argv[1] if len(sys.argv) > 1 else None
    if test_file and os.path.exists(test_file):
        result = classify_audio(test_file)
    else:
        # Create test siren
        test_wav = os.path.join(os.path.dirname(__file__), "test_siren.wav")
        generate_synthetic_siren_wav(test_wav, duration_sec=2.0)
        result = classify_audio(test_wav)
        fusion = compute_fusion_score(vision_score=0.92, audio_score=result["siren_score"], modality="emergency_siren")
        result["fusion_example"] = fusion

    print(json.dumps(result, indent=2))
