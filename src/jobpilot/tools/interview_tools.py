from __future__ import annotations

from fastmcp import FastMCP

from jobpilot.services.interview_service import generate_interview_questions, get_application_checklist

mcp = FastMCP("jobpilot")


@mcp.tool()
def generate_interview_questions_tool(
    candidate_id: str,
    job_id: str,
    question_type: str = "mixed",
    number: int = 8,
) -> list[str]:
    """Generate interview questions based on a candidate profile and the job description."""
    return generate_interview_questions(
        candidate_id=candidate_id,
        job_id=job_id,
        question_type=question_type,
        number=number,
    )


@mcp.tool()
def get_application_checklist_tool(candidate_id: str, job_id: str) -> list[dict]:
    """Return a personalized checklist for applying and preparing for an interview."""
    return get_application_checklist(candidate_id=candidate_id, job_id=job_id)
