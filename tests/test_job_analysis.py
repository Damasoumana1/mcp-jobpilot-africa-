import pytest
from pydantic import ValidationError
from starlette.testclient import TestClient

from jobpilot.models.job_analysis import JobAnalysisRequest
from jobpilot.services.candidate_service import upsert_candidate
from jobpilot.services.job_analysis_service import analyze_job, list_job_analyses
from jobpilot.tools.job_tools import analyze_job_offer_tool
from jobpilot.web import app


def test_analysis_aliases_evidence_and_no_profile_mutation():
    upsert_candidate("ANALYST", "Candidate", "Kenya", skills=["python", "Postgres", "C++"])
    text = "Backend developer\nRequired: Python, PostgreSQL, C++ and Rust."
    report = analyze_job(JobAnalysisRequest(candidate_id="ANALYST", job_text=text))
    assert report.coverage_score == 75
    assert report.recommendation == "promising"
    assert {s.name for s in report.skills if s.matched} == {"Python", "PostgreSQL", "C++"}
    assert all(s.evidence in text for s in report.skills)
    assert report.id is None
    assert list_job_analyses("ANALYST") == []


def test_no_detected_skills_does_not_claim_perfect_match():
    report = analyze_job_offer_tool("DAMA-001", "Nous recherchons une personne pour accompagner notre équipe.")
    assert report.coverage_score is None
    assert report.recommendation == "insufficient_data"
    assert "availability_unverified" in report.warnings


def test_save_retains_snapshot_and_isolates_candidates():
    request = JobAnalysisRequest(candidate_id="DAMA-001", job_text="Développeur Python recherché pour une équipe internationale.")
    saved = analyze_job(request, save=True)
    upsert_candidate("OTHER", "Other", "Kenya", skills=[])
    assert list_job_analyses("OTHER") == []
    assert list_job_analyses("DAMA-001")[0] == saved
    assert saved.id is not None


@pytest.mark.parametrize("payload", [
    {}, {"candidate_id": "DAMA-001", "job_text": " " * 40},
    {"candidate_id": "DAMA-001", "job_text": "x" * 20001},
    {"candidate_id": "DAMA-001", "job_text": "x" * 40, "source_url": "javascript:alert(1)"},
    {"candidate_id": "DAMA-001", "job_text": "x" * 40, "source_url": "http://example.org"},
])
def test_request_validation(payload):
    with pytest.raises(ValidationError):
        JobAnalysisRequest.model_validate(payload)


def test_api_analysis_validation_save_history_and_route_order():
    client = TestClient(app)
    payload = {"candidate_id": "DAMA-001", "job_text": "Python developer wanted for our remote engineering team."}
    preview = client.post("/api/jobs/analyze", json=payload)
    assert preview.status_code == 200
    assert preview.json()["id"] is None
    saved = client.post("/api/job-analyses", json=payload)
    assert saved.status_code == 201
    history = client.get("/api/job-analyses", params={"candidate_id": "DAMA-001"})
    assert history.json() == [saved.json()]
    assert client.get("/api/job-analyses").status_code == 400
    assert client.post("/api/jobs/analyze", json=[]).status_code == 400
    assert client.post("/api/jobs/analyze", content="{", headers={"Content-Type": "application/json"}).status_code == 400
    assert client.post("/api/jobs/analyze", json={**payload, "candidate_id": "MISSING"}).status_code == 404


def test_dashboard_assets_are_served():
    import re

    client = TestClient(app)
    html = client.get("/").text
    paths = re.findall(r'(?:src|href)="(/assets/[^\"]+)"', html)
    assert paths
    for path in paths:
        assert client.get(path).status_code == 200
