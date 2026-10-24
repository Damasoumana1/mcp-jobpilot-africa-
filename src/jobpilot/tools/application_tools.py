from __future__ import annotations

from fastmcp import FastMCP

from jobpilot.services.application_service import create_application, update_application_status

mcp = FastMCP("jobpilot")


@mcp.tool()
def create_application_tool(candidate_id: str, job_id: str, status: str = "saved") -> dict:
    """Create an application tracking record for a candidate and a job."""
    return create_application(candidate_id=candidate_id, job_id=job_id, status=status)


@mcp.tool()
def update_application_status_tool(application_id: str, status: str, notes: str | None = None) -> dict:
    """Update the status and notes of an application."""
    return update_application_status(application_id=application_id, status=status, notes=notes)
