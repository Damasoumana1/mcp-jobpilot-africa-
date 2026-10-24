from __future__ import annotations

import pytest

from jobpilot.models.application import Application
from jobpilot.services.application_service import create_application, list_applications, update_application_status
from jobpilot.tools.application_tools import create_application_tool, list_applications_tool, update_application_status_tool


def test_create_and_update_application_flow():
    app = create_application("DAMA-001", "JOB-001", status="saved")
    assert app["candidate_id"] == "DAMA-001"
    assert app["job_id"] == "JOB-001"

    updated = update_application_status(app["id"], "interview", notes="Strong fit, continue follow-up.")
    assert updated["status"] == "interview"
    assert "Strong fit" in updated["notes"]

    apps = list_applications("DAMA-001")
    assert len(apps) >= 1
    assert any(a["id"] == app["id"] for a in apps)


def test_application_tools_return_pydantic_model():
    app = create_application_tool("DAMA-001", "JOB-002", status="applied")
    assert isinstance(app, Application)
    assert app.status == "applied"
    assert app.job_id == "JOB-002"

    updated = update_application_status_tool(app.id, status="offer", notes="Contract received")
    assert isinstance(updated, Application)
    assert updated.status == "offer"
    assert updated.notes == "Contract received"

    app_list = list_applications_tool("DAMA-001")
    assert len(app_list) >= 1
    assert all(isinstance(a, Application) for a in app_list)


def test_create_application_invalid_foreign_keys():
    with pytest.raises(ValueError, match="Candidate 'UNKNOWN' not found"):
        create_application("UNKNOWN", "JOB-001")

    with pytest.raises(ValueError, match="Job 'UNKNOWN' not found"):
        create_application("DAMA-001", "UNKNOWN")


def test_update_nonexistent_application():
    with pytest.raises(ValueError, match="Application 'INVALID' not found"):
        update_application_status("INVALID", "applied")
