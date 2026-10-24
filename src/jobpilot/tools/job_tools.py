from __future__ import annotations

from jobpilot.mcp_app import mcp
from jobpilot.models.job import Job
from jobpilot.services.job_service import get_job, search_jobs


@mcp.tool(name="search_jobs")
def search_jobs_tool(
    keywords: list[str] | str | None = None,
    country: str | None = None,
    remote_only: bool = False,
    min_duration_months: int | None = None,
) -> list[Job]:
    """Search internship and early-career opportunities across Africa by keyword, location and remote status."""
    parsed_keywords = keywords
    if isinstance(keywords, str):
        parsed_keywords = [k.strip() for k in keywords.split(",") if k.strip()]

    raw_jobs = search_jobs(
        keywords=parsed_keywords,
        country=country,
        remote_only=remote_only,
        min_duration_months=min_duration_months,
    )
    return [Job.model_validate(job) for job in raw_jobs]


@mcp.tool(name="get_job")
def get_job_tool(job_id: str) -> Job:
    """Return the complete details of a specific job opportunity including required skills."""
    job = get_job(job_id)
    if job is None:
        raise ValueError(f"Job '{job_id}' not found")
    return Job.model_validate(job)
