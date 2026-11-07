from __future__ import annotations

import pytest

from jobpilot.models.application import Application
from jobpilot.services.application_service import create_application, list_applications, update_application_status, update_application
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


def test_generate_cover_letter_bilingual():
    from jobpilot.services.application_service import generate_cover_letter
    from jobpilot.tools.application_tools import generate_cover_letter_tool

    # 1. French Generation
    res_fr = generate_cover_letter("DAMA-001", "JOB-001", language="fr")
    assert "Candidature" in res_fr["email_subject"]
    assert "Madame, Monsieur" in res_fr["cover_letter"]
    assert "Bonjour" in res_fr["linkedin_pitch"]

    # 2. English Generation
    res_en = generate_cover_letter("DAMA-001", "JOB-001", language="en")
    assert "Application" in res_en["email_subject"]
    assert "Dear Hiring Team" in res_en["cover_letter"]
    assert "Hi!" in res_en["linkedin_pitch"]

    # 3. FastMCP tool with language
    tool_res = generate_cover_letter_tool("DAMA-001", "JOB-001", language="en")
    assert "Application" in tool_res.email_subject


def test_follow_up_preserves_status_and_notes_and_can_be_completed():
    app = create_application("DAMA-001", "JOB-001", status="interview")
    update_application_status(app["id"], "interview", notes="Keep these notes")
    planned = update_application(app["id"], {"next_action": "  Contact recruiter  ", "follow_up_date": "2028-02-29"})
    assert planned["next_action"] == "Contact recruiter"
    assert planned["follow_up_date"] == "2028-02-29"
    assert planned["status"] == "interview"
    assert planned["notes"] == "Keep these notes"
    changed = update_application_status(app["id"], "applied")
    assert changed["follow_up_date"] == "2028-02-29"
    cleared = update_application(app["id"], {"follow_up_date": None, "next_action": None})
    assert cleared["follow_up_date"] is None
    assert cleared["next_action"] is None
    assert cleared["notes"] == "Keep these notes"


def test_mcp_follow_up_round_trip():
    from jobpilot.tools.application_tools import set_application_follow_up_tool
    app = create_application("DAMA-001", "JOB-001")
    updated = set_application_follow_up_tool(app["id"], "Send portfolio", "2026-11-08")
    assert updated.follow_up_date == "2026-11-08"
    assert list_applications_tool("DAMA-001")[0].next_action == "Send portfolio"
    assert set_application_follow_up_tool(app["id"], None, None).follow_up_date is None


def test_existing_database_migration_preserves_application(tmp_path, monkeypatch):
    import sqlite3
    from jobpilot.database.connection import init_db, get_connection
    legacy = tmp_path / "legacy.db"
    with sqlite3.connect(legacy) as conn:
        conn.execute("""CREATE TABLE applications (id TEXT PRIMARY KEY, candidate_id TEXT NOT NULL,
            job_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'saved', applied_at TEXT,
            next_action TEXT, notes TEXT)""")
        conn.execute("INSERT INTO applications VALUES ('OLD', 'DAMA-001', 'JOB-001', 'interview', '2026-10-01', 'Call recruiter', 'Legacy notes')")
    monkeypatch.setenv("DATABASE_PATH", str(legacy))
    init_db()
    init_db()  # The migration must also be safe on subsequent starts.
    conn = get_connection()
    try:
        row = dict(conn.execute("SELECT * FROM applications WHERE id='OLD'").fetchone())
        assert row["follow_up_date"] is None
        assert row["next_action"] == "Call recruiter"
        assert row["status"] == "interview"
        assert row["notes"] == "Legacy notes"
    finally:
        conn.close()

