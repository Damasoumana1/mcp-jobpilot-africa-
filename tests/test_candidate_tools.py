from __future__ import annotations

import pytest

from jobpilot.models.candidate import Candidate
from jobpilot.services.candidate_service import get_candidate, list_candidates, upsert_candidate
from jobpilot.tools.candidate_tools import get_candidate_tool, register_candidate_tool


def test_get_candidate_found():
    candidate = get_candidate("DAMA-001")
    assert candidate is not None
    assert candidate["full_name"] == "Dama Soumana"
    assert "Python" in candidate["skills"]


def test_get_candidate_not_found():
    candidate = get_candidate("UNKNOWN")
    assert candidate is None


def test_list_candidates():
    candidates = list_candidates()
    assert len(candidates) >= 1
    assert any(c["id"] == "DAMA-001" for c in candidates)


def test_upsert_and_tools():
    created = register_candidate_tool(
        candidate_id="TEST-002",
        full_name="Amina Diallo",
        country="Senegal",
        city="Dakar",
        email="amina@example.com",
        skills=["Python", "FastAPI", "Docker"],
    )
    assert isinstance(created, Candidate)
    assert created.id == "TEST-002"
    assert "Docker" in created.skills

    fetched = get_candidate_tool("TEST-002")
    assert isinstance(fetched, Candidate)
    assert fetched.full_name == "Amina Diallo"


def test_get_candidate_tool_not_found():
    with pytest.raises(ValueError, match="not found"):
        get_candidate_tool("UNKNOWN_CANDIDATE")
