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


def generate_cover_letter(candidate_id: str, job_id: str, tone: str = "professional") -> dict:
    """Generate a tailored cover letter, email subject, and LinkedIn outreach pitch."""
    conn = get_connection()
    try:
        cand_row = conn.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
        if not cand_row:
            raise ValueError(f"Candidate '{candidate_id}' not found")
        job_row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not job_row:
            raise ValueError(f"Job '{job_id}' not found")

        candidate = dict(cand_row)
        job = dict(job_row)

        skill_rows = conn.execute(
            """
            SELECT s.name
            FROM candidate_skills cs
            JOIN skills s ON s.id = cs.skill_id
            WHERE cs.candidate_id = ?
            """,
            (candidate_id,),
        ).fetchall()
        skills = [r["name"] for r in skill_rows]
    finally:
        conn.close()

    candidate_name = candidate["full_name"]
    company = job["company"]
    job_title = job["title"]
    skills_summary = ", ".join(skills[:4]) if skills else "Python et les architectures modernes"

    email_subject = f"Candidature : {job_title} - {candidate_name}"

    cover_letter = (
        f"Madame, Monsieur l'équipe de recrutement chez {company},\n\n"
        f"C'est avec un grand enthousiasme que je vous adresse ma candidature pour l'opportunité de {job_title}. "
        f"Titulaire d'un {candidate['education'] or 'parcours technique solide'} et passionné(e) par l'écosystème tech en Afrique, "
        f"j'ai développé des compétences pratiques en {skills_summary}.\n\n"
        f"Votre mission chez {company} résonne particulièrement avec mon projet professionnel. "
        f"{job.get('description', '')[:200]}... "
        f"Mon expérience me permet de m'adapter rapidement et d'apporter une valeur immédiate à votre équipe d'ingénierie.\n\n"
        f"Je serais ravi(e) de convenir d'un échange afin de vous détailler mes réalisations et ma motivation.\n\n"
        f"Bien cordialement,\n"
        f"{candidate_name}\n"
        f"{candidate.get('email', '')} | {candidate.get('country', '')}"
    )

    linkedin_pitch = (
        f"Bonjour, je suis {candidate_name}, développeur basé en/au {candidate.get('country', 'Afrique')}. "
        f"Très impressionné par la trajectoire de {company}, je viens de postuler pour le poste de {job_title}. "
        f"Spécialisé en {skills_summary}, seriez-vous ouvert à un court échange de 10 min pour discuter des défis techniques de l'équipe ?"
    )

    return {
        "candidate_id": candidate_id,
        "job_id": job_id,
        "company": company,
        "job_title": job_title,
        "email_subject": email_subject,
        "cover_letter": cover_letter,
        "linkedin_pitch": linkedin_pitch,
    }
