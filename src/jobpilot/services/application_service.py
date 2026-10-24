from __future__ import annotations

import uuid
from datetime import datetime

from jobpilot.database.connection import get_connection


def create_application(candidate_id: str, job_id: str, status: str = "saved") -> dict:
    """Create an application record for a candidate and a job."""
    conn = get_connection()
    try:
        candidate = conn.execute("SELECT id FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
        if not candidate:
            raise ValueError(f"Candidate '{candidate_id}' not found")
        job = conn.execute("SELECT id FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not job:
            raise ValueError(f"Job '{job_id}' not found")

        app_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.utcnow().isoformat()

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
        existing = conn.execute("SELECT id FROM applications WHERE id = ?", (application_id,)).fetchone()
        if not existing:
            raise ValueError(f"Application '{application_id}' not found")

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


def list_applications(candidate_id: str | None = None) -> list[dict]:
    """List applications, optionally filtered by candidate_id."""
    conn = get_connection()
    try:
        if candidate_id:
            rows = conn.execute(
                "SELECT * FROM applications WHERE candidate_id = ? ORDER BY applied_at DESC",
                (candidate_id,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM applications ORDER BY applied_at DESC").fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
