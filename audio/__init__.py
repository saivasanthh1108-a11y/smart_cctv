"""Audio processing package for AegisCorridor."""
from .siren_yamnet import (
    YamnetAudioClassifier,
    classify_audio,
    compute_fusion_score,
    generate_synthetic_siren_wav,
    generate_synthetic_crash_wav,
)
