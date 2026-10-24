from __future__ import annotations

import pytest

from jobpilot.server import mcp


@pytest.mark.anyio
async def test_mcp_server_lists_all_tools():
    tools = await mcp.list_tools()
    tool_names = {t.name for t in tools}

    expected_tools = {
        # Job discovery
        "search_jobs",
        "get_job",
        # Candidate profiles & matching
        "get_candidate",
        "register_candidate",
        "match_candidate_to_job",
        # Application tracking
        "create_application",
        "update_application_status",
        "list_applications",
        # Interview & Preparation
        "generate_interview_questions",
        "get_application_checklist",
    }
    assert expected_tools.issubset(tool_names)
