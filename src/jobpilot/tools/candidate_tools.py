from __future__ import annotations

from jobpilot.mcp_app import mcp
from jobpilot.models.matching import MatchResult
from jobpilot.services.matching_service import match_candidate_to_job


@mcp.tool(name="match_candidate_to_job")
def match_candidate_to_job_tool(candidate_id: str, job_id: str) -> MatchResult:
    """Compare a candidate profile against a job and return score, matched skills, gaps, and recommendations."""
    raw = match_candidate_to_job(candidate_id=candidate_id, job_id=job_id)
    return MatchResult.model_validate(raw)
