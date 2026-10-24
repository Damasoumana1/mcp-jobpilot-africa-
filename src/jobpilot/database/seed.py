from __future__ import annotations

import json
from pathlib import Path

from jobpilot.config import BASE_DIR, DATA_DIR
from jobpilot.database.connection import get_connection


def seed_demo_data() -> None:
    """Populate database from JSON files in data/ or with built-in fallback data."""
    conn = get_connection()
    try:
        cursor = conn.cursor()

        candidates_file = DATA_DIR / "candidates.json"
        if not candidates_file.exists():
            candidates_file = BASE_DIR / "data" / "candidates.json"

        jobs_file = DATA_DIR / "jobs.json"
        if not jobs_file.exists():
            jobs_file = BASE_DIR / "data" / "jobs.json"

        # 1. Load candidates from JSON or fallback
        candidates_data = []
        if candidates_file.exists():
            try:
                candidates_data = json.loads(candidates_file.read_text(encoding="utf-8"))
            except Exception:
                candidates_data = []

        if not candidates_data:
            candidates_data = [
                {
                    "id": "DAMA-001",
                    "full_name": "Dama Soumana",
                    "country": "Burkina Faso",
                    "city": "Ouagadougou",
                    "email": "dama@example.com",
                    "availability_date": "2027-02-01",
                    "languages": "French, English",
                    "education": "Bachelor in Computer Science",
                    "summary": "AI and backend developer interested in RAG, LangGraph and AI automation workflows.",
                    "skills": ["Python", "FastAPI", "RAG", "LangGraph", "Qdrant", "SQL", "Communication"],
                }
            ]

        # 2. Load jobs from JSON or fallback
        jobs_data = []
        if jobs_file.exists():
            try:
                jobs_data = json.loads(jobs_file.read_text(encoding="utf-8"))
            except Exception:
                jobs_data = []

        if not jobs_data:
            jobs_data = [
                {
                    "id": "JOB-001",
                    "title": "AI Intern",
                    "company": "AfrikaLabs",
                    "country": "Burkina Faso",
                    "remote_allowed": True,
                    "employment_type": "internship",
                    "duration_months": 6,
                    "compensation": "Paid",
                    "description": "Build and prototype AI-powered workflows including RAG and document search systems.",
                    "application_url": "https://example.com/jobs/1",
                    "closing_date": "2027-03-15",
                    "skills": ["Python", "RAG", "LangGraph", "SQL"],
                },
                {
                    "id": "JOB-002",
                    "title": "AI Automation Engineer",
                    "company": "Trace Digital",
                    "country": "Remote",
                    "remote_allowed": True,
                    "employment_type": "full-time",
                    "duration_months": 12,
                    "compensation": "Competitive",
                    "description": "Design AI workflows, automation pipelines, and agent orchestration using modern Python stacks.",
                    "application_url": "https://example.com/jobs/2",
                    "closing_date": "2027-04-01",
                    "skills": ["Python", "RAG", "LangGraph", "n8n", "PydanticAI"],
                },
                {
                    "id": "JOB-003",
                    "title": "Junior Python Backend Developer",
                    "company": "DataBridge",
                    "country": "Senegal",
                    "remote_allowed": False,
                    "employment_type": "internship",
                    "duration_months": 4,
                    "compensation": "Stipend",
                    "description": "Build backend APIs with FastAPI and help integrate internal tools and services.",
                    "application_url": "https://example.com/jobs/3",
                    "closing_date": "2027-02-20",
                    "skills": ["Python", "FastAPI", "SQL", "Communication"],
                },
            ]

        # Insert candidates and their skills
        for c in candidates_data:
            cursor.execute(
                """
                INSERT OR IGNORE INTO candidates (
                    id, full_name, country, city, email, availability_date, languages, education, summary
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    c["id"],
                    c["full_name"],
                    c["country"],
                    c.get("city"),
                    c.get("email"),
                    c.get("availability_date"),
                    c.get("languages"),
                    c.get("education"),
                    c.get("summary"),
                ),
            )
            for skill_name in c.get("skills", []):
                cursor.execute(
                    "INSERT OR IGNORE INTO skills (name, category) VALUES (?, ?)",
                    (skill_name, "technical"),
                )
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
                        (c["id"], skill_row["id"], "intermediate", 1.0),
                    )

        # Insert jobs and their skills
        for j in jobs_data:
            cursor.execute(
                """
                INSERT OR IGNORE INTO jobs (
                    id, title, company, country, remote_allowed, employment_type, duration_months,
                    compensation, description, application_url, closing_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    j["id"],
                    j["title"],
                    j["company"],
                    j.get("country"),
                    int(bool(j.get("remote_allowed", False))),
                    j.get("employment_type"),
                    j.get("duration_months"),
                    j.get("compensation"),
                    j.get("description"),
                    j.get("application_url"),
                    j.get("closing_date"),
                ),
            )
            for skill_name in j.get("skills", []):
                cursor.execute(
                    "INSERT OR IGNORE INTO skills (name, category) VALUES (?, ?)",
                    (skill_name, "technical"),
                )
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
                        (j["id"], skill_row["id"], "intermediate", 1),
                    )

        conn.commit()
    finally:
        conn.close()
