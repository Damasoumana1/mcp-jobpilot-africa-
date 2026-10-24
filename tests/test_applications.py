from jobpilot.services.application_service import create_application, update_application_status


def test_create_and_update_application_flow():
    app = create_application("DAMA-001", "JOB-001", status="saved")
    assert app["candidate_id"] == "DAMA-001"
    assert app["job_id"] == "JOB-001"

    updated = update_application_status(app["id"], "interview", notes="Strong fit, continue follow-up.")
    assert updated["status"] == "interview"
    assert "Strong fit" in updated["notes"]
