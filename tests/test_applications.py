from __future__ import annotations

from jobpilot.models.application import Application
from jobpilot.services.application_service import create_application, update_application_status
from jobpilot.tools.application_tools import create_application_tool, update_application_status_tool


def test_create_and_update_application_flow():
    app = create_application("DAMA-001", "JOB-001", status="saved")
    assert app["candidate_id"] == "DAMA-001"
    assert app["job_id"] == "JOB-001"

    updated = update_application_status(app["id"], "interview", notes="Strong fit, continue follow-up.")
    assert updated["status"] == "interview"
    assert "Strong fit" in updated["notes"]


def test_application_tools_return_pydantic_model():
    app = create_application_tool("DAMA-001", "JOB-002", status="applied")
    assert isinstance(app, Application)
    assert app.status == "applied"
    assert app.job_id == "JOB-002"

    updated = update_application_status_tool(app.id, status="offer", notes="Contract received")
    assert isinstance(updated, Application)
    assert updated.status == "offer"
    assert updated.notes == "Contract received"
