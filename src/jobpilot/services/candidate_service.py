from __future__ import annotations

from jobpilot.database.connection import get_connection


def _get_skills_for_candidate(conn, candidate_id: str) -> list[str]:
    rows = conn.execute(
        """
        SELECT s.name
        FROM candidate_skills cs
        JOIN skills s ON s.id = cs.skill_id
        WHERE cs.candidate_id = ?
        """,
        (candidate_id,),
    ).fetchall()
    return [row["name"] for row in rows]


def get_candidate(candidate_id: str) -> dict | None:
    """Retrieve full candidate profile including skills."""
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
        if not row:
            return None
        data = dict(row)
        data["skills"] = _get_skills_for_candidate(conn, candidate_id)
        return data
    finally:
        conn.close()


def list_candidates() -> list[dict]:
    """Retrieve all candidates in the database."""
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM candidates ORDER BY full_name ASC").fetchall()
        candidates = []
        for row in rows:
            data = dict(row)
            data["skills"] = _get_skills_for_candidate(conn, data["id"])
            candidates.append(data)
        return candidates
    finally:
        conn.close()


def upsert_candidate(
    candidate_id: str,
    full_name: str,
    country: str,
    city: str | None = None,
    email: str | None = None,
    availability_date: str | None = None,
    languages: str | None = None,
    education: str | None = None,
    summary: str | None = None,
    skills: list[str] | None = None,
) -> dict:
    """Create or update a candidate profile and their skills."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO candidates (id, full_name, country, city, email, availability_date, languages, education, summary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                full_name = excluded.full_name,
                country = excluded.country,
                city = excluded.city,
                email = excluded.email,
                availability_date = excluded.availability_date,
                languages = excluded.languages,
                education = excluded.education,
                summary = excluded.summary
            """,
            (candidate_id, full_name, country, city, email, availability_date, languages, education, summary),
        )

        if skills is not None:
            # Delete old skills association
            cursor.execute("DELETE FROM candidate_skills WHERE candidate_id = ?", (candidate_id,))
            for skill_name in skills:
                # Ensure skill exists in master table
                cursor.execute(
                    "INSERT OR IGNORE INTO skills (name, category) VALUES (?, ?)",
                    (skill_name, "technical"),
                )
                skill_row = cursor.execute("SELECT id FROM skills WHERE name = ?", (skill_name,)).fetchone()
                if skill_row:
                    cursor.execute(
                        """
                        INSERT OR IGNORE INTO candidate_skills (candidate_id, skill_id, level, years_experience)
                        VALUES (?, ?, ?, ?)
                        """,
                        (candidate_id, skill_row["id"], "intermediate", 1.0),
                    )

        conn.commit()
        return get_candidate(candidate_id) or {}
    finally:
        conn.close()
