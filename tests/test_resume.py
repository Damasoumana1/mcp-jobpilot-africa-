from __future__ import annotations

import pytest

from jobpilot.services.candidate_service import get_candidate
from jobpilot.services.resume_service import extract_skills_from_text, parse_resume
from jobpilot.tools.candidate_tools import parse_resume_tool


SAMPLE_RESUME = """
Dama Soumana
Email: dama.soumana@example.com | Tel: +221 77 123 45 67
Dakar, Sénégal

Profil:
Développeur passionné avec 2 ans d'expérience dans les technologies web modernes et les agents IA.

Compétences Techniques:
- Langages: Python, TypeScript, SQL, Bash
- Frameworks & Web: React, FastAPI, Next.js, Tailwind CSS
- Data & IA: FastMCP, Model Context Protocol, PyTorch, Pandas
- DevOps & Outils: Docker, Git, CI/CD, PostgreSQL, Linux

Formation:
Licence en Génie Logiciel - Université Cheikh Anta Diop (UCAD)

Langues:
Français (courant), Anglais (technique)
"""


def test_extract_skills_from_text():
    skills = extract_skills_from_text("Experience with Python, FastAPI, Docker, and React.")
    assert "Python" in skills
    assert "FastAPI" in skills
    assert "Docker" in skills
    assert "React" in skills
    assert "Java" not in skills


def test_parse_resume_structure():
    result = parse_resume(SAMPLE_RESUME, candidate_id="TEST-RESUME-001", auto_save=False)
    assert result["candidate_id"] == "TEST-RESUME-001"
    assert result["full_name"] == "Dama Soumana"
    assert result["email"] == "dama.soumana@example.com"
    assert result["country"] == "Sénégal"
    assert result["experience_years"] == 2
    assert "Licence" in result["education"]
    assert "Python" in result["skills"]
    assert "FastAPI" in result["skills"]
    assert "Docker" in result["skills"]
    assert result["skills_count"] >= 5
    assert result["auto_saved"] is False


def test_parse_resume_empty_raises_error():
    with pytest.raises(ValueError, match="Resume text cannot be empty"):
        parse_resume("   ")


def test_parse_resume_with_auto_save():
    # Parse and save directly to candidate profile
    result = parse_resume(SAMPLE_RESUME, candidate_id="DAMA-001", auto_save=True)
    assert result["auto_saved"] is True

    # Verify candidate in database has merged skills
    candidate = get_candidate("DAMA-001")
    assert candidate is not None
    assert "Python" in candidate["skills"]
    assert "Docker" in candidate["skills"]


def test_parse_resume_tool():
    res = parse_resume_tool(SAMPLE_RESUME, candidate_id="DAMA-001", auto_save=False)
    assert isinstance(res, dict)
    assert "skills" in res
    assert len(res["skills"]) > 0
