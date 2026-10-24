from __future__ import annotations

from jobpilot.database.connection import get_connection


def _get_candidate_skills(candidate_id: str) -> list[str]:
    conn = get_connection()
    try:
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
    finally:
        conn.close()


def _get_job_skills(job_id: str) -> list[str]:
    conn = get_connection()
    try:
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
    finally:
        conn.close()


def match_candidate_to_job(candidate_id: str, job_id: str) -> dict:
    """Compare candidate skills with job requirements and return a match summary."""
    conn = get_connection()
    try:
        candidate = conn.execute("SELECT id FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
        if not candidate:
            raise ValueError(f"Candidate '{candidate_id}' not found")
        job = conn.execute("SELECT id FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not job:
            raise ValueError(f"Job '{job_id}' not found")
    finally:
        conn.close()

    candidate_skills = set(_get_candidate_skills(candidate_id))
    job_skills = set(_get_job_skills(job_id))

    matching_skills = sorted(candidate_skills & job_skills)
    missing_skills = sorted(job_skills - candidate_skills)

    total = max(len(job_skills), 1)
    match_score = int(round((len(matching_skills) / total) * 100))

    recommendations = [
        "Add a project that demonstrates the required stack",
        "Review the gaps and prepare examples for your strongest matching skills",
        "Practice explaining your experience with the required tools and workflows",
    ]

    if missing_skills:
        recommendations = [
            f"Learn the basics of {skill} and build a small project around it." for skill in missing_skills[:3]
        ] + recommendations[:2]

    return {
        "candidate_id": candidate_id,
        "job_id": job_id,
        "match_score": max(0, min(match_score, 100)),
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "recommendations": recommendations,
    }
