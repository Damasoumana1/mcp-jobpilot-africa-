from jobpilot.services.matching_service import match_candidate_to_job


def test_match_candidate_to_job_returns_a_score():
    result = match_candidate_to_job("DAMA-001", "JOB-001")
    assert "match_score" in result
    assert "matching_skills" in result
    assert "missing_skills" in result
    assert result["match_score"] >= 0
