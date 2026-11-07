from __future__ import annotations

import sqlite3
from pathlib import Path

from jobpilot.config import ensure_data_dir, get_database_path


def get_connection() -> sqlite3.Connection:
    ensure_data_dir()
    db_path = get_database_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    ensure_data_dir()
    db_path = get_database_path()
    conn = sqlite3.connect(db_path)
    try:
        schema_sql = Path(__file__).with_name("schema.sql").read_text(encoding="utf-8")
        conn.executescript(schema_sql)
        # Upgrade existing installations without replacing application records.
        columns = {row[1] for row in conn.execute("PRAGMA table_info(applications)")}
        if "follow_up_date" not in columns:
            conn.execute("ALTER TABLE applications ADD COLUMN follow_up_date TEXT")
        conn.commit()
    finally:
        conn.close()
