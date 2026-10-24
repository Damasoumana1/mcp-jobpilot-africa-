from __future__ import annotations

import pytest

from jobpilot.models.interview import ChecklistItem
from jobpilot.services.interview_service import generate_interview_questions, get_application_checklist
from jobpilot.tools.interview_tools import generate_interview_questions_tool, get_application_checklist_tool


def test_generate_interview_questions():
    questions = generate_interview_questions("DAMA-001", "JOB-001", number=5)
    assert len(questions) == 5
    assert any("experience" in q.lower() or "why" in q.lower() for q in questions)


def test_get_application_checklist():
    checklist = get_application_checklist("DAMA-001", "JOB-001")
    assert len(checklist) >= 3
    assert all("task" in item and "priority" in item for item in checklist)


def test_interview_tools():
    questions = generate_interview_questions_tool("DAMA-001", "JOB-001", number=4)
    assert len(questions) == 4

    checklist = get_application_checklist_tool("DAMA-001", "JOB-001")
    assert len(checklist) >= 3
    assert isinstance(checklist[0], ChecklistItem)
    assert checklist[0].task != ""


def test_interview_invalid_ids():
    with pytest.raises(ValueError, match="Candidate 'UNKNOWN' not found"):
        generate_interview_questions("UNKNOWN", "JOB-001")

    with pytest.raises(ValueError, match="Job 'UNKNOWN' not found"):
        get_application_checklist("DAMA-001", "UNKNOWN")
