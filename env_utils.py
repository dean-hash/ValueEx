"""
Environment Variable Utilities

Provides consistent environment variable loading across the project.
"""
import os
from pathlib import Path
from typing import Any, Optional, Union

# Project root directory (2 levels up from this file)
PROJECT_ROOT = Path(__file__).parent.parent

class EnvConfig:
    """Environment variable configuration manager."""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EnvConfig, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._load_dotenv()
            self._initialized = True
    
    def _load_dotenv(self):
        """Load environment variables from .env files."""
        try:
            from dotenv import load_dotenv
            # Try to load from root .env first, then fall back to module-specific ones
            env_files = [
                PROJECT_ROOT / '.env',
                PROJECT_ROOT / '.env.local',  # For local overrides
            ]
            
            for env_file in env_files:
                if env_file.exists():
                    load_dotenv(env_file, override=True)
                    
        except ImportError:
            # dotenv not installed, rely on system environment variables
            pass
    
    def get(self, key: str, default: Any = None, required: bool = False) -> Optional[str]:
        """Get an environment variable.
        
        Args:
            key: The environment variable name
            default: Default value if not found
            required: If True, raises KeyError if variable is not set
            
        Returns:
            The environment variable value, or default if not found
            
        Raises:
            KeyError: If required is True and variable is not set
        """
        value = os.environ.get(key, default)
        if required and value is None:
            raise KeyError(f"Required environment variable not set: {key}")
        return value
    
    def get_bool(self, key: str, default: bool = False) -> bool:
        """Get a boolean environment variable.
        
        Args:
            key: The environment variable name
            default: Default value if not found
            
        Returns:
            The boolean value of the environment variable
        """
        value = self.get(key, str(default)).lower()
        return value in ('true', '1', 't', 'y', 'yes')
    
    def get_int(self, key: str, default: int = 0) -> int:
        """Get an integer environment variable.
        
        Args:
            key: The environment variable name
            default: Default value if not found or invalid
            
        Returns:
            The integer value of the environment variable
        """
        try:
            return int(self.get(key, str(default)))
        except (ValueError, TypeError):
            return default
    
    def get_float(self, key: str, default: float = 0.0) -> float:
        """Get a float environment variable.
        
        Args:
            key: The environment variable name
            default: Default value if not found or invalid
            
        Returns:
            The float value of the environment variable
        """
        try:
            return float(self.get(key, str(default)))
        except (ValueError, TypeError):
            return default

# Create a singleton instance
env = EnvConfig()

# Common environment variable getters
def get_env(key: str, default: Any = None, required: bool = False) -> Optional[str]:
    """Get an environment variable."""
    return env.get(key, default, required)

def get_env_bool(key: str, default: bool = False) -> bool:
    """Get a boolean environment variable."""
    return env.get_bool(key, default)

def get_env_int(key: str, default: int = 0) -> int:
    """Get an integer environment variable."""
    return env.get_int(key, default)

def get_env_float(key: str, default: float = 0.0) -> float:
    """Get a float environment variable."""
    return env.get_float(key, default)
