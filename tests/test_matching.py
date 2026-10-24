from __future__ import annotations

import pytest

from jobpilot.models.matching import MatchResult
from jobpilot.services.matching_service import match_candidate_to_job
from jobpilot.tools.candidate_tools import match_candidate_to_job_tool


def test_match_candidate_to_job_returns_a_score():
    result = match_candidate_to_job("DAMA-001", "JOB-001")
    assert "match_score" in result
    assert "matching_skills" in result
    assert "missing_skills" in result
    assert result["match_score"] >= 0
    assert result["candidate_id"] == "DAMA-001"
    assert result["job_id"] == "JOB-001"


def test_match_tool_returns_pydantic_model():
    res = match_candidate_to_job_tool("DAMA-001", "JOB-001")
    assert isinstance(res, MatchResult)
    assert res.match_score > 0
    assert "Python" in res.matching_skills


def test_match_invalid_ids_raise_value_error():
    with pytest.raises(ValueError, match="Candidate 'UNKNOWN' not found"):
        match_candidate_to_job("UNKNOWN", "JOB-001")

    with pytest.raises(ValueError, match="Job 'UNKNOWN' not found"):
        match_candidate_to_job("DAMA-001", "UNKNOWN")
