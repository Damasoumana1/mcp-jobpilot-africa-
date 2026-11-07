from __future__ import annotations

from jobpilot.mcp_app import mcp
from jobpilot.models.application import Application
from jobpilot.models.outreach import CoverLetter
from jobpilot.services.application_service import (
    create_application,
    generate_cover_letter,
    list_applications,
    update_application_status,
    update_application,
)


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


@mcp.tool(name="set_application_follow_up")
def set_application_follow_up_tool(application_id: str, next_action: str | None, follow_up_date: str | None) -> Application:
    """Set a next action and YYYY-MM-DD follow-up date. Pass null for both to complete/clear the reminder. Does not send messages."""
    raw = update_application(application_id, {"next_action": next_action, "follow_up_date": follow_up_date})
    return Application.model_validate(raw)


@mcp.tool(name="generate_cover_letter")
def generate_cover_letter_tool(
    candidate_id: str,
    job_id: str,
    tone: str = "professional",
    language: str = "fr",
) -> CoverLetter:
    """Generate a tailored cover letter, email subject, and LinkedIn pitch for a candidate and job (supports French & English)."""
    raw = generate_cover_letter(candidate_id=candidate_id, job_id=job_id, tone=tone, language=language)
    return CoverLetter.model_validate(raw)

