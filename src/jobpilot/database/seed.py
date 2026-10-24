from __future__ import annotations

from jobpilot.database.connection import get_connection


def seed_demo_data() -> None:
    conn = get_connection()
    try:
        cursor = conn.cursor()

        candidates = [
            (
                "DAMA-001",
                "Dama Soumana",
                "Burkina Faso",
                "Ouagadougou",
                "dama@example.com",
                "2027-02-01",
                "French, English",
                "Bachelor in Computer Science",
                "AI and backend developer interested in RAG, LangGraph and AI automation workflows.",
            )
        ]

        cursor.executemany(
            """
            INSERT OR IGNORE INTO candidates (
                id, full_name, country, city, email, availability_date, languages, education, summary
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            candidates,
        )

        skills = [
            ("Python", "technical"),
            ("FastAPI", "technical"),
            ("RAG", "technical"),
            ("LangGraph", "technical"),
            ("Qdrant", "technical"),
            ("n8n", "technical"),
            ("PydanticAI", "technical"),
            ("SQL", "technical"),
            ("Communication", "soft"),
            ("Project Management", "soft"),
        ]

        cursor.executemany(
            "INSERT OR IGNORE INTO skills (name, category) VALUES (?, ?)",
            skills,
        )

        candidate_skills = [
            ("DAMA-001", "Python", "advanced", 2.5),
            ("DAMA-001", "FastAPI", "advanced", 1.5),
            ("DAMA-001", "RAG", "intermediate", 1.0),
            ("DAMA-001", "LangGraph", "intermediate", 1.0),
            ("DAMA-001", "Qdrant", "intermediate", 0.5),
            ("DAMA-001", "SQL", "intermediate", 1.5),
            ("DAMA-001", "Communication", "advanced", 2.0),
        ]

        for candidate_id, skill_name, level, years in candidate_skills:
            skill_row = cursor.execute(
                "SELECT id FROM skills WHERE name = ?",
                (skill_name,),
            ).fetchone()
            if skill_row:
                cursor.execute(
                    """
                    INSERT OR IGNORE INTO candidate_skills (candidate_id, skill_id, level, years_experience)
                    VALUES (?, ?, ?, ?)
                    """,
                    (candidate_id, skill_row["id"], level, years),
                )

        jobs = [
            (
                "JOB-001",
                "AI Intern",
                "AfrikaLabs",
                "Burkina Faso",
                True,
                "internship",
                6,
                "Paid",
                "Build and prototype AI-powered workflows including RAG and document search systems.",
                "https://example.com/jobs/1",
                "2027-03-15",
            ),
            (
                "JOB-002",
                "AI Automation Engineer",
                "Trace Digital",
                "Remote",
                True,
                "full-time",
                12,
                "Competitive",
                "Design AI workflows, automation pipelines, and agent orchestration using modern Python stacks.",
                "https://example.com/jobs/2",
                "2027-04-01",
            ),
            (
                "JOB-003",
                "Junior Python Backend Developer",
                "DataBridge",
                "Senegal",
                False,
                "internship",
                4,
                "Stipend",
                "Build backend APIs with FastAPI and help integrate internal tools and services.",
                "https://example.com/jobs/3",
                "2027-02-20",
            ),
        ]

        cursor.executemany(
            """
            INSERT OR IGNORE INTO jobs (
                id, title, company, country, remote_allowed, employment_type, duration_months,
                compensation, description, application_url, closing_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            jobs,
        )

        job_skill_map = {
            "JOB-001": [("Python", "advanced", True), ("RAG", "intermediate", True), ("LangGraph", "intermediate", True), ("SQL", "beginner", False)],
            "JOB-002": [("Python", "advanced", True), ("RAG", "advanced", True), ("LangGraph", "advanced", True), ("n8n", "intermediate", True), ("PydanticAI", "intermediate", True)],
            "JOB-003": [("Python", "advanced", True), ("FastAPI", "advanced", True), ("SQL", "intermediate", True), ("Communication", "intermediate", False)],
        }

        for job_id, skill_entries in job_skill_map.items():
            for skill_name, required_level, is_required in skill_entries:
                skill_row = cursor.execute(
                    "SELECT id FROM skills WHERE name = ?",
                    (skill_name,),
                ).fetchone()
                if skill_row:
                    cursor.execute(
                        """
                        INSERT OR IGNORE INTO job_skills (job_id, skill_id, required_level, is_required)
                        VALUES (?, ?, ?, ?)
                        """,
                        (job_id, skill_row["id"], required_level, int(is_required)),
                    )

        conn.commit()
    finally:
        conn.close()
