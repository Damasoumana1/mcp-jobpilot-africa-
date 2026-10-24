from __future__ import annotations

from jobpilot.database.connection import get_connection


def search_jobs(
    keywords: list[str] | None = None,
    country: str | None = None,
    remote_only: bool = False,
    min_duration_months: int | None = None,
) -> list[dict]:
    """Search jobs from the local SQLite database."""
    conn = get_connection()
    try:
        query = """
            SELECT j.*
            FROM jobs j
            WHERE 1 = 1
        """
        params: list[object] = []

        if country:
            query += " AND LOWER(j.country) = LOWER(?) "
            params.append(country)

        if remote_only:
            query += " AND j.remote_allowed = 1 "

        if min_duration_months is not None:
            query += " AND j.duration_months >= ? "
            params.append(min_duration_months)

        if keywords:
            clauses = []
            for _ in keywords:
                clauses.append("LOWER(j.title || ' ' || COALESCE(j.description, '')) LIKE LOWER(?)")
            query += " AND (" + " OR ".join(clauses) + ") "
            for keyword in keywords:
                params.append(f"%{keyword}%")

        rows = conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_job(job_id: str) -> dict | None:
    """Return the details of a single job."""
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()
