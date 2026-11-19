from __future__ import annotations

import pytest

from jobpilot.server import BearerTokenMiddleware, mcp


@pytest.mark.anyio
async def test_mcp_server_lists_all_tools():
    tools = await mcp.list_tools()
    tool_names = {t.name for t in tools}

    expected_tools = {
        # Job discovery & Recruiter management
        "search_jobs",
        "get_job",
        "create_job",
        "analyze_job_offer",
        "list_job_analyses",
        "get_geography",
        "import_greenhouse_jobs",
        # Candidate profiles & matching
        "get_candidate",
        "register_candidate",
        "match_candidate_to_job",
        # Application tracking & Outreach
        "create_application",
        "update_application_status",
        "set_application_follow_up",
        "prepare_application_pack",
        "list_applications",
        "generate_cover_letter",
        # Interview & Preparation
        "generate_interview_questions",
        "get_application_checklist",
        "parse_resume",
    }
    assert tool_names == expected_tools


def test_bearer_middleware_rejects_missing_token():
    async def inner_app(scope, receive, send):
        raise AssertionError("The protected app should not run")

    middleware = BearerTokenMiddleware(inner_app, "test-secret")
    scope = {
        "type": "http",
        "headers": [],
    }

    import asyncio

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    sent = []

    async def send(message):
        sent.append(message)

    asyncio.run(middleware(scope, receive, send))
    assert sent[0]["status"] == 401
