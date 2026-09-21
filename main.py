import sys
import os
from pathlib import Path

# Add backend directory to sys.path so app package is importable from root
backend_path = (Path(__file__).resolve().parent / "backend").as_posix()
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app
