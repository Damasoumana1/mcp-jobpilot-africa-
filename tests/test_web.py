from __future__ import annotations

import json
from starlette.testclient import TestClient
import pytest

from jobpilot.web import app

client = TestClient(app)


def test_index_page_returns_html():
    res = client.get("/")
    assert res.status_code == 200
    assert "JobPilot Africa" in res.text
    assert "id=\"root\"" in res.text



def test_api_jobs_get_and_post():
    res = client.get("/api/jobs")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 3

    new_job = {
        "id": "JOB-TEST-99",
        "title": "Platform Engineer",
        "company": "Paystack",
        "country": "Nigeria",
        "remote_allowed": True,
        "skills": ["Python", "Docker", "SQL"],
    }
    create_res = client.post("/api/jobs", json=new_job)
    assert create_res.status_code == 201
    assert create_res.json()["company"] == "Paystack"


def test_api_candidates():
    res = client.get("/api/candidates")
    assert res.status_code == 200
    data = res.json()
    assert any(c["id"] == "DAMA-001" for c in data)


def test_api_matching_flow():
    res = client.post("/api/match", json={"candidate_id": "DAMA-001", "job_id": "JOB-001"})
    assert res.status_code == 200
    data = res.json()
    assert "match_score" in data
    assert "relocation_needed" in data
    assert data["match_score"] > 0


def test_api_cover_letter():
    res = client.post("/api/applications/cover-letter", json={"candidate_id": "DAMA-001", "job_id": "JOB-001"})
    assert res.status_code == 200
    data = res.json()
    assert "cover_letter" in data
    assert "linkedin_pitch" in data
    assert "AfrikaLabs" in data["cover_letter"]


def test_api_interview_endpoints():
    res_q = client.post("/api/interview/questions", json={"candidate_id": "DAMA-001", "job_id": "JOB-001", "number": 3})
    assert res_q.status_code == 200
    assert len(res_q.json()) == 3

    res_c = client.post("/api/interview/checklist", json={"candidate_id": "DAMA-001", "job_id": "JOB-001"})
    assert res_c.status_code == 200
    assert len(res_c.json()) >= 2


def test_api_copilot_chat():
    res = client.post("/api/copilot/chat", json={"message": "Quels sont les stages en remote ?", "candidate_id": "DAMA-001"})
    assert res.status_code == 200
    assert "reply" in res.json()
    assert len(res.json()["reply"]) > 10


def test_candidate_journey_keeps_applications_and_preparation_separate():
    profile = {"id": "CAND-NEW", "full_name": "Awa Test", "country": "Mali", "skills": ["Python"]}
    created = client.post("/api/candidates", json=profile)
    assert created.status_code == 201
    assert created.json()["skills"] == ["Python"]
    assert client.get("/api/candidates/CAND-NEW").json()["full_name"] == "Awa Test"
    assert client.get("/api/applications", params={"candidate_id": "CAND-NEW"}).json() == []
    application = client.post("/api/applications", json={"candidate_id": "CAND-NEW", "job_id": "JOB-001"})
    assert application.status_code == 201
    own = client.get("/api/applications", params={"candidate_id": "CAND-NEW"}).json()
    other = client.get("/api/applications", params={"candidate_id": "DAMA-001"}).json()
    assert [row["id"] for row in own] == [application.json()["id"]]
    assert all(row["candidate_id"] == "DAMA-001" for row in other)
    for path in ("questions", "checklist"):
        response = client.post(f"/api/interview/{path}", json={"candidate_id": "CAND-NEW", "job_id": "JOB-001", "number": 3})
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        if path == "questions":
            assert len(response.json()) == 3
            assert all(isinstance(question, str) for question in response.json())
        else:
            assert all({"task", "priority", "completed"} <= row.keys() for row in response.json())


@pytest.mark.parametrize("path", ["questions", "checklist"])
@pytest.mark.parametrize("payload", [{}, {"candidate_id": " ", "job_id": "JOB-001"}, [], None])
def test_interview_rejects_invalid_context(path, payload):
    response = client.post(f"/api/interview/{path}", content=json.dumps(payload), headers={"Content-Type": "application/json"})
    assert response.status_code == 400


@pytest.mark.parametrize("number", [0, -1, 13, "3", True])
def test_interview_rejects_invalid_question_count(number):
    response = client.post("/api/interview/questions", json={"candidate_id": "DAMA-001", "job_id": "JOB-001", "number": number})
    assert response.status_code == 400


@pytest.mark.parametrize("payload", [{}, {"id": "NEW", "full_name": " ", "country": "Mali"}, {"id": "NEW", "full_name": "Awa", "country": "Mali", "skills": "Python"}])
def test_candidate_creation_rejects_invalid_profiles(payload):
    assert client.post("/api/candidates", json=payload).status_code == 400


def test_api_follow_up_is_partial_persistent_and_filtered_by_profile():
    client.post("/api/candidates", json={"id": "OTHER", "full_name": "Other", "country": "Mali"})
    app = client.post("/api/applications", json={"candidate_id": "DAMA-001", "job_id": "JOB-001", "status": "interview"}).json()
    response = client.patch(f"/api/applications/{app['id']}", json={"next_action": "Follow up", "follow_up_date": "2026-11-07"})
    assert response.status_code == 200
    assert response.json()["status"] == "interview"
    own = client.get("/api/applications", params={"candidate_id": "DAMA-001"}).json()
    persisted = next(row for row in own if row["id"] == app["id"])
    assert persisted["follow_up_date"] == "2026-11-07"
    assert persisted["job_title"] == "AI Intern"
    assert persisted["company"] == "AfrikaLabs"
    assert client.get("/api/applications", params={"candidate_id": "OTHER"}).json() == []
    cleared = client.patch(f"/api/applications/{app['id']}", json={"follow_up_date": None})
    assert cleared.json()["follow_up_date"] is None
    assert cleared.json()["next_action"] == "Follow up"


@pytest.mark.parametrize("payload", [
    {}, {"follow_up_date": "2026-02-29"}, {"follow_up_date": "2026-11-31"},
    {"follow_up_date": "20261107"}, {"follow_up_date": "2026-1-07"},
    {"follow_up_date": "2026-11-07T00:00:00Z"}, {"follow_up_date": 123},
    {"status": None}, {"status": "unknown"}, {"next_action": "a" * 501},
    {"candidate_id": "OTHER"}, [], None,
])
def test_api_rejects_invalid_follow_up_without_partial_changes(payload):
    app = client.post("/api/applications", json={"candidate_id": "DAMA-001", "job_id": "JOB-001", "status": "interview"}).json()
    response = client.patch(f"/api/applications/{app['id']}", content=json.dumps(payload), headers={"Content-Type": "application/json"})
    assert response.status_code == 400
    persisted = next(row for row in client.get("/api/applications").json() if row["id"] == app["id"])
    assert persisted["status"] == "interview"
    assert persisted["follow_up_date"] is None
