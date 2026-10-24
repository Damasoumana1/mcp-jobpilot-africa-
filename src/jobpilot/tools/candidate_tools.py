from __future__ import annotations

from jobpilot.mcp_app import mcp
from jobpilot.models.candidate import Candidate
from jobpilot.models.matching import MatchResult
from jobpilot.services.candidate_service import get_candidate, upsert_candidate
from jobpilot.services.matching_service import match_candidate_to_job


@mcp.tool(name="get_candidate")
def get_candidate_tool(candidate_id: str) -> Candidate:
    """Retrieve full candidate details including skills, availability, and background."""
    data = get_candidate(candidate_id)
    if not data:
        raise ValueError(f"Candidate '{candidate_id}' not found")
    return Candidate.model_validate(data)


@mcp.tool(name="register_candidate")
def register_candidate_tool(
    candidate_id: str,
    full_name: str,
    country: str,
    city: str | None = None,
    email: str | None = None,
    availability_date: str | None = None,
    languages: str | None = None,
    education: str | None = None,
    summary: str | None = None,
    skills: list[str] | None = None,
) -> Candidate:
    """Create or update a candidate profile with skills and contact details."""
    data = upsert_candidate(
        candidate_id=candidate_id,
        full_name=full_name,
        country=country,
        city=city,
        email=email,
        availability_date=availability_date,
        languages=languages,
        education=education,
        summary=summary,
        skills=skills,
    )
    return Candidate.model_validate(data)


@mcp.tool(name="match_candidate_to_job")
def match_candidate_to_job_tool(candidate_id: str, job_id: str) -> MatchResult:
    """Compare a candidate profile against a job and return score, matched skills, gaps, and recommendations."""
    raw = match_candidate_to_job(candidate_id=candidate_id, job_id=job_id)
    return MatchResult.model_validate(raw)
