from __future__ import annotations

from jobpilot.database.connection import init_db
from jobpilot.database.seed import seed_demo_data
from jobpilot.tools.application_tools import create_application_tool, update_application_status_tool
from jobpilot.tools.candidate_tools import match_candidate_to_job_tool
from jobpilot.tools.interview_tools import generate_interview_questions_tool, get_application_checklist_tool
from jobpilot.tools.job_tools import get_job_tool, search_jobs_tool


def startup() -> None:
    init_db()
    seed_demo_data()


if __name__ == "__main__":
    startup()
    print("JobPilot MCP server is ready.")
