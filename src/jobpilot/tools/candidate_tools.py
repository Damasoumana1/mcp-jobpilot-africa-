from __future__ import annotations

from fastmcp import FastMCP

from jobpilot.services.matching_service import match_candidate_to_job

mcp = FastMCP("jobpilot")


@mcp.tool()
def match_candidate_to_job_tool(candidate_id: str, job_id: str) -> dict:
    """Compare a candidate profile against a job and return a match summary."""
    return match_candidate_to_job(candidate_id=candidate_id, job_id=job_id)
