from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
def get_database_path() -> Path:
    return Path(os.getenv("DATABASE_PATH", str(DATA_DIR / "demo.db")))


DATABASE_PATH = get_database_path()
DEBUG = os.getenv("DEBUG", "true").lower() == "true"
APP_NAME = os.getenv("APP_NAME", "mcp-jobpilot-africa")


def ensure_data_dir() -> None:
    get_database_path().parent.mkdir(parents=True, exist_ok=True)
