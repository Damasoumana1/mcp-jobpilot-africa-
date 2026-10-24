from __future__ import annotations

from jobpilot.mcp_app import mcp
from jobpilot.models.application import Application
from jobpilot.services.application_service import create_application, list_applications, update_application_status


@mcp.tool(name="create_application")
def create_application_tool(candidate_id: str, job_id: str, status: str = "saved") -> Application:
    """Create an application tracking record for a candidate and a job."""
    raw = create_application(candidate_id=candidate_id, job_id=job_id, status=status)
    return Application.model_validate(raw)


@mcp.tool(name="update_application_status")
def update_application_status_tool(application_id: str, status: str, notes: str | None = None) -> Application:
    """Update the status and notes of an application."""
    raw = update_application_status(application_id=application_id, status=status, notes=notes)
    return Application.model_validate(raw)


@mcp.tool(name="list_applications")
def list_applications_tool(candidate_id: str | None = None) -> list[Application]:
    """List tracked applications, optionally filtered by a specific candidate_id."""
    raw_list = list_applications(candidate_id=candidate_id)
    return [Application.model_validate(app) for app in raw_list]
