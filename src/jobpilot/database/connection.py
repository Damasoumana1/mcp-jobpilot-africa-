from __future__ import annotations

import sqlite3
from pathlib import Path

from jobpilot.config import DATABASE_PATH, ensure_data_dir


def get_connection() -> sqlite3.Connection:
    ensure_data_dir()
    db_path = Path(DATABASE_PATH)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    ensure_data_dir()
    db_path = Path(DATABASE_PATH)
    conn = sqlite3.connect(db_path)
    try:
        schema_sql = Path(__file__).with_name("schema.sql").read_text(encoding="utf-8")
        conn.executescript(schema_sql)
        conn.commit()
    finally:
        conn.close()
