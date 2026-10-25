from __future__ import annotations

from jobpilot.database.connection import get_connection


def match_candidate_to_job(candidate_id: str, job_id: str) -> dict:
    """Compare candidate skills with job requirements using weighted scoring and location checks."""
    conn = get_connection()
    try:
        candidate = conn.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
        if not candidate:
            raise ValueError(f"Candidate '{candidate_id}' not found")
        job = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not job:
            raise ValueError(f"Job '{job_id}' not found")

        job_skill_rows = conn.execute(
            """
            SELECT s.name, js.is_required
            FROM job_skills js
            JOIN skills s ON s.id = js.skill_id
            WHERE js.job_id = ?
            """,
            (job_id,),
        ).fetchall()

        cand_skill_rows = conn.execute(
            """
            SELECT s.name
            FROM candidate_skills cs
            JOIN skills s ON s.id = cs.skill_id
            WHERE cs.candidate_id = ?
            """,
            (candidate_id,),
        ).fetchall()
    finally:
        conn.close()

    candidate_skills = {row["name"] for row in cand_skill_rows}
    job_skills_dict = {row["name"]: bool(row["is_required"]) for row in job_skill_rows}

    # Fallback if no skills are defined in job_skills
    if not job_skills_dict:
        return {
            "candidate_id": candidate_id,
            "job_id": job_id,
            "match_score": 100,
            "matching_skills": sorted(candidate_skills),
            "missing_skills": [],
            "recommendations": ["Aucune compétence préalable exigée pour cette opportunité."],
            "relocation_needed": False,
            "remote_compatible": True,
            "mandatory_skills_met": True,
        }

    matching_skills = sorted([s for s in job_skills_dict if s in candidate_skills])
    missing_skills = sorted([s for s in job_skills_dict if s not in candidate_skills])

    mandatory_skills = {s for s, req in job_skills_dict.items() if req}
    mandatory_missing = mandatory_skills - candidate_skills
    mandatory_skills_met = len(mandatory_missing) == 0

    # Weighted scoring: mandatory skills count 2x, optional skills 1x
    total_points = sum(2 if req else 1 for req in job_skills_dict.values()) or 1
    earned_points = sum(2 if job_skills_dict[s] else 1 for s in matching_skills)
    match_score = int(round((earned_points / total_points) * 100))

    # Location & Remote compatibility check
    cand_country = (candidate["country"] or "").strip().lower()
    job_country = (job["country"] or "").strip().lower()
    is_remote = bool(job["remote_allowed"]) or job_country == "remote"

    relocation_needed = False
    remote_compatible = True
    if not is_remote and cand_country and job_country and cand_country != job_country:
        relocation_needed = True
        remote_compatible = False

    recommendations: list[str] = []
    if relocation_needed:
        recommendations.append(f"Poste sur site situé en/au {job['country']}. Une mobilité ou relocalisation est requise.")
    if not mandatory_skills_met:
        recommendations.append(f"Priorisez l'acquisition des compétences clés : {', '.join(sorted(mandatory_missing)[:2])}.")
    if missing_skills:
        for skill in missing_skills[:2]:
            if skill not in mandatory_missing:
                recommendations.append(f"Renforcez vos connaissances en {skill} via un projet personnel.")

    recommendations.extend([
        "Préparez des exemples concrets pour valoriser vos compétences acquises lors de l'entretien.",
        "Mettez en avant votre esprit d'initiative et vos workflows d'automatisation.",
    ])

    return {
        "candidate_id": candidate_id,
        "job_id": job_id,
        "match_score": max(0, min(match_score, 100)),
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "recommendations": recommendations[:4],
        "relocation_needed": relocation_needed,
        "remote_compatible": remote_compatible,
        "mandatory_skills_met": mandatory_skills_met,
    }
