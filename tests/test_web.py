from __future__ import annotations

from starlette.testclient import TestClient

from jobpilot.web import app

client = TestClient(app)


def test_index_page_returns_html():
    res = client.get("/")
    assert res.status_code == 200
    assert "JobPilot Africa" in res.text
    assert "Opportunités Tech en Afrique" in res.text


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
