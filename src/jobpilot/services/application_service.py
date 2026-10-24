from __future__ import annotations

import uuid
from datetime import datetime

from jobpilot.database.connection import get_connection


def create_application(candidate_id: str, job_id: str, status: str = "saved") -> dict:
    """Create an application record for a candidate and a job."""
    app_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.utcnow().isoformat()

    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT INTO applications (id, candidate_id, job_id, status, applied_at, next_action)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (app_id, candidate_id, job_id, status, now, "Review application details"),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM applications WHERE id = ?", (app_id,)).fetchone()
        return dict(row)
    finally:
        conn.close()


def update_application_status(application_id: str, status: str, notes: str | None = None) -> dict:
    """Update the current status of an application."""
    conn = get_connection()
    try:
        conn.execute(
            """
            UPDATE applications
            SET status = ?, notes = COALESCE(?, notes)
            WHERE id = ?
            """,
            (status, notes, application_id),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM applications WHERE id = ?", (application_id,)).fetchone()
        return dict(row)
    finally:
        conn.close()
