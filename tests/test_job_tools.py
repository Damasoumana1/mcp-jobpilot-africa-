from __future__ import annotations

import pytest

from jobpilot.models.job import Job
from jobpilot.services.job_service import get_job, search_jobs
from jobpilot.tools.job_tools import get_job_tool, search_jobs_tool


def test_search_jobs_returns_results():
    results = search_jobs(keywords=["Python", "RAG"], country="Burkina Faso", remote_only=True)
    assert isinstance(results, list)
    assert len(results) >= 1
    assert "Python" in results[0]["skills"]


def test_get_job_found():
    job = get_job("JOB-001")
    assert job is not None
    assert job["title"] == "AI Intern"
    assert "skills" in job
    assert len(job["skills"]) > 0


def test_get_job_not_found():
    job = get_job("NONEXISTENT")
    assert job is None


def test_job_tools_return_pydantic_models():
    jobs = search_jobs_tool(country="Burkina Faso")
    assert len(jobs) >= 1
    assert isinstance(jobs[0], Job)
    assert jobs[0].id == "JOB-001"

    job = get_job_tool("JOB-001")
    assert isinstance(job, Job)
    assert job.company == "AfrikaLabs"

    with pytest.raises(ValueError, match="not found"):
        get_job_tool("INVALID-ID")
