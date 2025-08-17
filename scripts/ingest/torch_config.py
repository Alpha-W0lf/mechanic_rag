#!/usr/bin/env python3
"""PyTorch configuration for optimal M2 Max performance."""

import os
import warnings
from typing import Optional


def configure_torch_for_m2_max() -> None:
    """Configure PyTorch settings optimized for M2 Max MacBook Pro.
    
    This function:
    1. Suppresses MPS warnings that don't affect functionality
    2. Sets optimal threading for M2 Max (10-core CPU)
    3. Configures memory allocation for unified memory architecture
    """
    # Suppress specific PyTorch MPS warnings
    warnings.filterwarnings("ignore", message=".*pin_memory.*MPS.*")
    warnings.filterwarnings("ignore", category=UserWarning, module="torch.utils.data.dataloader")
    
    # Environment variables for optimal M2 Max performance
    env_settings = {
        # Optimize for M2 Max CPU cores (8 performance + 2 efficiency)
        "OMP_NUM_THREADS": "8",  # Use performance cores for compute
        "MKL_NUM_THREADS": "8",
        "NUMEXPR_NUM_THREADS": "8",
        
        # Memory optimization for 32GB unified memory
        "PYTORCH_MPS_HIGH_WATERMARK_RATIO": "0.8",  # Use up to 80% of memory
        
        # Disable problematic MPS features
        "PYTORCH_ENABLE_MPS_FALLBACK": "1",  # Allow CPU fallback
        
        # Threading optimization
        "TORCH_NUM_THREADS": "8",
    }
    
    for key, value in env_settings.items():
        os.environ[key] = value
    
    # Configure torch if available
    try:
        import torch
        
        # Set number of threads for optimal M2 Max performance
        torch.set_num_threads(8)
        
        # Enable optimization for inference
        torch.set_grad_enabled(False)  # Disable gradients for inference
        
        print(f"✅ PyTorch configured for M2 Max - Device: {get_best_device()}")
        
    except ImportError:
        print("⚠️  PyTorch not available - basic optimizations applied")


def get_best_device() -> str:
    """Get the best available device for M2 Max."""
    try:
        import torch
        
        if torch.backends.mps.is_available():
            return "mps"
        else:
            return "cpu"
    except (ImportError, AttributeError):
        return "cpu"


def suppress_warnings() -> None:
    """Suppress common ML library warnings that don't affect functionality."""
    import warnings
    
    # Suppress all the MPS pin_memory warnings
    warnings.filterwarnings("ignore", message=".*pin_memory.*MPS.*")
    warnings.filterwarnings("ignore", category=UserWarning, module="torch")
    
    # Suppress other common ML warnings
    warnings.filterwarnings("ignore", category=FutureWarning, module="transformers")
    warnings.filterwarnings("ignore", category=UserWarning, module="docling")


# Call configuration on import
configure_torch_for_m2_max()
suppress_warnings()
