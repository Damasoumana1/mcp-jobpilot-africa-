from __future__ import annotations

from jobpilot.database.connection import get_connection


def generate_interview_questions(candidate_id: str, job_id: str, question_type: str = "mixed", number: int = 8) -> list[str]:
    """Generate interview questions based on the candidate profile and job requirements."""
    conn = get_connection()
    try:
        candidate = conn.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
        if not candidate:
            raise ValueError(f"Candidate '{candidate_id}' not found")
        job = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not job:
            raise ValueError(f"Job '{job_id}' not found")

        skill_rows = conn.execute(
            """
            SELECT s.name
            FROM job_skills js
            JOIN skills s ON s.id = js.skill_id
            WHERE js.job_id = ?
            """,
            (job_id,),
        ).fetchall()

        skills = [row["name"] for row in skill_rows]
        base_questions = [
            f"Can you explain your experience with {skill}?" for skill in skills[:4]
        ]

        base_questions.append(f"Why are you interested in working at {job['company']}?")
        base_questions.append(f"How would you approach a project involving {job['title']} in a real-world setting?")
        base_questions.append(f"Tell us about your background in {candidate['education'] or 'your studies'}.")
        base_questions.append("What is one project you are most proud of and why?")

        base_questions.extend([
            "Describe a time you solved a technical challenge with a clear process.",
            "What would you do if a deadline was moving quickly while requirements were still unclear?",
            "How do you prioritize learning when working on a new technology stack?",
            "What questions do you have about this role and the team?",
        ])

        return base_questions[:number]
    finally:
        conn.close()


def get_application_checklist(candidate_id: str, job_id: str) -> list[dict]:
    """Return a checklist of tasks for a job application."""
    conn = get_connection()
    try:
        job = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        if not job:
            raise ValueError(f"Job '{job_id}' not found")
        candidate = conn.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
        if not candidate:
            raise ValueError(f"Candidate '{candidate_id}' not found")

        tasks = [
            {"task": "Prepare a two-minute introduction", "priority": "high", "completed": False},
            {"task": f"Review your {job['title']} experience and examples", "priority": "high", "completed": False},
            {"task": "Prepare your strongest project demonstrations", "priority": "high", "completed": False},
            {"task": "Review the skills required for this role and identify gaps", "priority": "medium", "completed": False},
            {"task": f"Confirm your availability date: {candidate['availability_date']}", "priority": "medium", "completed": False},
        ]
        return tasks
    finally:
        conn.close()
