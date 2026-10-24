from __future__ import annotations

from jobpilot.database.connection import get_connection


def _get_skills_for_job(conn, job_id: str) -> list[str]:
    rows = conn.execute(
        """
        SELECT s.name
        FROM job_skills js
        JOIN skills s ON s.id = js.skill_id
        WHERE js.job_id = ?
        """,
        (job_id,),
    ).fetchall()
    return [row["name"] for row in rows]


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
        results = []
        for row in rows:
            data = dict(row)
            data["skills"] = _get_skills_for_job(conn, data["id"])
            results.append(data)
        return results
    finally:
        conn.close()


def get_job(job_id: str) -> dict | None:
    """Return the details of a single job."""
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not row:
            return None
        data = dict(row)
        data["skills"] = _get_skills_for_job(conn, job_id)
        return data
    finally:
        conn.close()
