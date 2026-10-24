from __future__ import annotations

from fastmcp import FastMCP

from jobpilot.services.job_service import get_job, search_jobs

mcp = FastMCP("jobpilot")


@mcp.tool()
def search_jobs_tool(
    keywords: list[str] | None = None,
    country: str | None = None,
    remote_only: bool = False,
    min_duration_months: int | None = None,
) -> list[dict]:
    """Search internship and early-career opportunities by keyword, location and remote status."""
    return search_jobs(
        keywords=keywords,
        country=country,
        remote_only=remote_only,
        min_duration_months=min_duration_months,
    )


@mcp.tool()
def get_job_tool(job_id: str) -> dict:
    """Return the complete details of a specific job opportunity."""
    job = get_job(job_id)
    if job is None:
        raise ValueError(f"Job {job_id} not found")
    return job
