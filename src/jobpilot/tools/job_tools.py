from __future__ import annotations

from jobpilot.mcp_app import mcp
from jobpilot.models.job import Job
from jobpilot.models.job_analysis import JobAnalysis, JobAnalysisRequest
from jobpilot.services.job_analysis_service import analyze_job, list_job_analyses
from jobpilot.services.job_service import get_job, search_jobs
from jobpilot.geography import COUNTRIES, REGIONS


@mcp.tool(name="get_geography")
def get_geography_tool() -> dict:
    """List all 55 AU members, FR/EN names, aliases, codes and five regions.

    Coverage does not imply that jobs are currently available in every country.
    """
    return {"countries": COUNTRIES, "regions": REGIONS}


@mcp.tool(name="analyze_job_offer")
def analyze_job_offer_tool(
    candidate_id: str, job_text: str, title: str = "", company: str = "",
    source_url: str | None = None, save: bool = False,
) -> JobAnalysis:
    """Explain skill mentions against a candidate profile; optionally save a report.

    Source URL is metadata only. Coverage is not a hiring probability; availability,
    eligibility and whether skills are mandatory must be reviewed by the candidate.
    """
    request = JobAnalysisRequest(candidate_id=candidate_id, job_text=job_text,
                                 title=title, company=company, source_url=source_url)
    return analyze_job(request, save=save)


@mcp.tool(name="list_job_analyses")
def list_job_analyses_tool(candidate_id: str) -> list[JobAnalysis]:
    """Retrieve the latest 100 saved offer analyses for a candidate."""
    return list_job_analyses(candidate_id)


@mcp.tool(name="search_jobs")
def search_jobs_tool(
    keywords: list[str] | str | None = None,
    country: str | None = None,
    remote_only: bool = False,
    min_duration_months: int | None = None,
    region: str | None = None,
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
        region=region,
    )
    return [Job.model_validate(job) for job in raw_jobs]


@mcp.tool(name="get_job")
def get_job_tool(job_id: str) -> Job:
    """Return the complete details of a specific job opportunity including required skills."""
    job = get_job(job_id)
    if job is None:
        raise ValueError(f"Job '{job_id}' not found")
    return Job.model_validate(job)


@mcp.tool(name="create_job")
def create_job_tool(
    job_id: str,
    title: str,
    company: str,
    country: str | None = None,
    remote_allowed: bool = False,
    employment_type: str = "internship",
    duration_months: int | None = None,
    compensation: str | None = None,
    description: str | None = None,
    application_url: str | None = None,
    closing_date: str | None = None,
    skills: list[str] | str | None = None,
) -> Job:
    """Register or update a job opportunity in the JobPilot database."""
    from jobpilot.services.job_service import create_job
    parsed_skills = skills
    if isinstance(skills, str):
        parsed_skills = [s.strip() for s in skills.split(",") if s.strip()]

    raw_job = create_job(
        id=job_id,
        title=title,
        company=company,
        country=country,
        remote_allowed=remote_allowed,
        employment_type=employment_type,
        duration_months=duration_months,
        compensation=compensation,
        description=description,
        application_url=application_url,
        closing_date=closing_date,
        skills=parsed_skills,
    )
    return Job.model_validate(raw_job)
