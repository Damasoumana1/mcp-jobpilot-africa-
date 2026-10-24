from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(DATA_DIR / "demo.db")))
DEBUG = os.getenv("DEBUG", "true").lower() == "true"
APP_NAME = os.getenv("APP_NAME", "mcp-jobpilot-africa")


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
