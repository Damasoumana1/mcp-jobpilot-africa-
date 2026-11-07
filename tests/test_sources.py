import pytest
from pydantic import ValidationError
from starlette.testclient import TestClient

from jobpilot.database.connection import get_connection
from jobpilot.services import source_service
from jobpilot.services.job_service import create_job, get_job, search_jobs
from jobpilot.services.source_service import GreenhouseRequest, import_greenhouse
from jobpilot.web import app


def posting(job_id=123, location="Remote - Kenya", **changes):
    return {"id": job_id, "title": "Backend developer", "location": {"name": location},
            "content": "&lt;p&gt;Python and PostgreSQL&lt;/p&gt;", "absolute_url": "https://example.org/job", **changes}


def test_preview_then_idempotent_import_with_provenance(monkeypatch):
    monkeypatch.setattr(source_service, "_fetch_board", lambda _: {"jobs": [posting(), posting(), posting(124, "Remote - US"), posting(125, "Remote")]})
    request = GreenhouseRequest(board="test", company="Test")
    preview = import_greenhouse(request)
    assert preview["eligible"] == 1
    assert preview["skipped_location"] == 2
    assert get_job("GH-test-123") is None
    request.save = True
    import_greenhouse(request)
    first_seen = get_job("GH-test-123")["last_seen_at"]
    import_greenhouse(request)
    job = get_job("GH-test-123")
    assert job["source"] == "greenhouse"
    assert job["country"] == "Kenya"
    assert job["remote_allowed"] == 1
    assert "<p>" not in job["description"]
    assert set(job["skills"]) == {"PostgreSQL", "Python"}
    assert len([j for j in search_jobs() if j["id"] == job["id"]]) == 1
    conn = get_connection()
    try:
        assert conn.execute("SELECT first_seen_at FROM job_sources WHERE job_id=?", (job["id"],)).fetchone()[0] == first_seen
    finally:
        conn.close()


@pytest.mark.parametrize("board", ["../x", "https://localhost", "test?x=1", "", "a/b"])
def test_board_validation(board):
    with pytest.raises(ValidationError):
        GreenhouseRequest(board=board, company="Test")


def test_invalid_source_does_not_partially_import(monkeypatch):
    monkeypatch.setattr(source_service, "_fetch_board", lambda _: {"jobs": [posting(), posting(124, title=None)]})
    with pytest.raises(ValueError):
        import_greenhouse(GreenhouseRequest(board="test", company="Test", save=True))
    assert get_job("GH-test-123") is None


def test_empty_response_does_not_remove_previous_import(monkeypatch):
    monkeypatch.setattr(source_service, "_fetch_board", lambda _: {"jobs": [posting()]})
    request = GreenhouseRequest(board="test", company="Test", save=True)
    import_greenhouse(request)
    monkeypatch.setattr(source_service, "_fetch_board", lambda _: {"jobs": []})
    import_greenhouse(request)
    assert get_job("GH-test-123") is not None


def test_local_collision_rolls_back_entire_batch(monkeypatch):
    create_job(id="GH-test-124", title="Local job", company="Local", country="Kenya")
    monkeypatch.setattr(source_service, "_fetch_board", lambda _: {"jobs": [posting(), posting(124)]})
    with pytest.raises(ValueError, match="conflicts"):
        import_greenhouse(GreenhouseRequest(board="test", company="Test", save=True))
    assert get_job("GH-test-123") is None
    assert get_job("GH-test-124")["title"] == "Local job"


def test_api_preview_and_invalid_payload(monkeypatch):
    monkeypatch.setattr(source_service, "_fetch_board", lambda _: {"jobs": [posting()]})
    client = TestClient(app)
    res = client.post("/api/sources/greenhouse/import", json={"board": "test", "company": "Test"})
    assert res.status_code == 200
    assert res.json()["saved"] is False
    assert client.post("/api/sources/greenhouse/import", json={"board": "test", "company": "Test", "save": "false"}).status_code == 400
    monkeypatch.setattr(source_service, "_fetch_board", lambda _: {"broken": True})
    assert client.post("/api/sources/greenhouse/import", json={"board": "test", "company": "Test"}).status_code == 502


def test_api_import_refreshes_catalogue_with_latest_board_and_provenance(monkeypatch):
    client = TestClient(app)
    monkeypatch.setattr(source_service, "_fetch_board", lambda _: {"jobs": [posting()]})
    payload = {"board": "test", "company": "Test"}
    preview = client.post("/api/sources/greenhouse/import", json=payload).json()
    assert preview["eligible"] == 1
    assert client.get("/api/jobs/GH-test-123").status_code == 404

    # The employer board may change after preview; the saved response is authoritative.
    monkeypatch.setattr(source_service, "_fetch_board", lambda _: {"jobs": [posting(125), posting(126, "Remote - US")]})
    saved = client.post("/api/sources/greenhouse/import", json={**payload, "save": True})
    assert saved.status_code == 200
    assert saved.json()["saved"] is True
    assert saved.json()["fetched"] == 2
    assert saved.json()["skipped_location"] == 1
    assert saved.json()["offers"][0]["id"] == "GH-test-125"
    catalogue = client.get("/api/jobs").json()
    imported = [job for job in catalogue if job["id"] == "GH-test-125"]
    assert len(imported) == 1
    assert imported[0]["source"] == "greenhouse"
    assert imported[0]["source_location"] == "Remote - Kenya"
    assert imported[0]["last_seen_at"]
    assert client.get("/api/jobs/GH-test-123").status_code == 404
