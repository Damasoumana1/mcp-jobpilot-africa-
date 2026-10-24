from __future__ import annotations

from jobpilot.mcp_app import mcp
from jobpilot.models.interview import ChecklistItem
from jobpilot.services.interview_service import generate_interview_questions, get_application_checklist


@mcp.tool(name="generate_interview_questions")
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


@mcp.tool(name="get_application_checklist")
def get_application_checklist_tool(candidate_id: str, job_id: str) -> list[ChecklistItem]:
    """Return a personalized checklist for applying and preparing for an interview."""
    raw_checklist = get_application_checklist(candidate_id=candidate_id, job_id=job_id)
    return [ChecklistItem.model_validate(item) for item in raw_checklist]
