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


def create_job(
    id: str,
    title: str,
    company: str,
    country: str | None = None,
    remote_allowed: bool = False,
    employment_type: str | None = "internship",
    duration_months: int | None = None,
    compensation: str | None = None,
    description: str | None = None,
    application_url: str | None = None,
    closing_date: str | None = None,
    skills: list[str] | None = None,
) -> dict:
    """Create a new job opportunity and associate its skills."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO jobs (
                id, title, company, country, remote_allowed, employment_type,
                duration_months, compensation, description, application_url, closing_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                company = excluded.company,
                country = excluded.country,
                remote_allowed = excluded.remote_allowed,
                employment_type = excluded.employment_type,
                duration_months = excluded.duration_months,
                compensation = excluded.compensation,
                description = excluded.description,
                application_url = excluded.application_url,
                closing_date = excluded.closing_date
            """,
            (
                id,
                title,
                company,
                country,
                int(bool(remote_allowed)),
                employment_type,
                duration_months,
                compensation,
                description,
                application_url,
                closing_date,
            ),
        )

        if skills:
            cursor.execute("DELETE FROM job_skills WHERE job_id = ?", (id,))
            for skill_name in skills:
                cursor.execute(
                    "INSERT OR IGNORE INTO skills (name, category) VALUES (?, ?)",
                    (skill_name, "technical"),
                )
                skill_row = cursor.execute("SELECT id FROM skills WHERE name = ?", (skill_name,)).fetchone()
                if skill_row:
                    cursor.execute(
                        """
                        INSERT OR IGNORE INTO job_skills (job_id, skill_id, required_level, is_required)
                        VALUES (?, ?, ?, ?)
                        """,
                        (id, skill_row["id"], "intermediate", 1),
                    )

        conn.commit()
        return get_job(id) or {}
    finally:
        conn.close()
