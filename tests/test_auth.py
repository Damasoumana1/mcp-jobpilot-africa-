from __future__ import annotations

from starlette.testclient import TestClient

from jobpilot.database.connection import get_connection
from jobpilot.web import app


def test_registration_login_me_and_logout():
    client = TestClient(app)

    me_before = client.get("/api/auth/me")
    assert me_before.status_code == 401

    registered = client.post(
        "/api/auth/register",
        json={
            "email": "candidate@example.com",
            "password": "A-secure-passphrase",
            "full_name": "Candidate Example",
        },
    )
    assert registered.status_code == 201
    assert registered.json()["email"] == "candidate@example.com"
    assert registered.json()["candidate_id"] is None

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "candidate@example.com"

    logged_out = client.post("/api/auth/logout")
    assert logged_out.status_code == 200
    assert client.get("/api/auth/me").status_code == 401

    login = client.post(
        "/api/auth/login",
        json={
            "email": "candidate@example.com",
            "password": "A-secure-passphrase",
        },
    )
    assert login.status_code == 200
    assert client.get("/api/auth/me").status_code == 200


def test_registration_rejects_duplicate_email():
    client = TestClient(app)
    payload = {
        "email": "duplicate@example.com",
        "password": "A-secure-passphrase",
        "full_name": "Duplicate Example",
    }

    first = client.post("/api/auth/register", json=payload)
    second = client.post("/api/auth/register", json=payload)

    assert first.status_code == 201
    assert second.status_code == 409


def test_candidates_are_isolated_between_users():
    first = TestClient(app)
    second = TestClient(app)

    first.post(
        "/api/auth/register",
        json={
            "email": "first@example.com",
            "password": "A-secure-passphrase",
            "full_name": "First Candidate",
        },
    )
    second.post(
        "/api/auth/register",
        json={
            "email": "second@example.com",
            "password": "A-secure-passphrase",
            "full_name": "Second Candidate",
        },
    )

    created = first.post(
        "/api/candidates",
        json={
            "id": "CAND-FIRST",
            "full_name": "First Candidate",
            "country": "Senegal",
            "skills": ["Python"],
        },
    )
    assert created.status_code == 201
    assert first.get("/api/candidates/CAND-FIRST").status_code == 200
    assert second.get("/api/candidates/CAND-FIRST").status_code == 404
    assert second.post(
        "/api/match",
        json={"candidate_id": "CAND-FIRST", "job_id": "JOB-001"},
    ).status_code == 404
    assert second.post(
        "/api/copilot/chat",
        json={"candidate_id": "CAND-FIRST", "message": "profil"},
    ).status_code == 404
    assert second.post(
        "/api/candidates",
        json={
            "id": "CAND-FIRST",
            "full_name": "Stolen Profile",
            "country": "Mali",
        },
    ).status_code == 403


def test_applications_are_isolated_between_users():
    first = TestClient(app)
    second = TestClient(app)

    first.post(
        "/api/auth/register",
        json={
            "email": "owner@example.com",
            "password": "A-secure-passphrase",
            "full_name": "Owner Candidate",
        },
    )
    second.post(
        "/api/auth/register",
        json={
            "email": "outsider@example.com",
            "password": "A-secure-passphrase",
            "full_name": "Outsider Candidate",
        },
    )

    first.post(
        "/api/candidates",
        json={
            "id": "CAND-OWNER",
            "full_name": "Owner Candidate",
            "country": "Burkina Faso",
        },
    )
    created = first.post(
        "/api/applications",
        json={
            "candidate_id": "CAND-OWNER",
            "job_id": "JOB-001",
            "status": "saved",
        },
    )
    assert created.status_code == 201
    application_id = created.json()["id"]

    assert second.get(
        "/api/applications",
        params={"candidate_id": "CAND-OWNER"},
    ).status_code == 404
    assert second.get("/api/applications").json() == []
    assert second.patch(
        f"/api/applications/{application_id}",
        json={"status": "interview"},
    ).status_code == 404

    guest = TestClient(app)
    assert guest.get("/api/candidates/CAND-OWNER").status_code == 404
    assert all(
        candidate["id"] != "CAND-OWNER"
        for candidate in guest.get("/api/candidates").json()
    )
    assert guest.get("/api/applications").json() == []
    assert guest.post(
        "/api/applications",
        json={"candidate_id": "CAND-OWNER", "job_id": "JOB-001"},
    ).status_code == 404


def test_authenticated_user_cannot_claim_unowned_candidate():
    client = TestClient(app)
    client.post(
        "/api/auth/register",
        json={
            "email": "claim@example.com",
            "password": "A-secure-passphrase",
            "full_name": "Claim Candidate",
        },
    )

    response = client.post(
        "/api/candidates",
        json={
            "id": "DAMA-001",
            "full_name": "Claim Candidate",
            "country": "Senegal",
        },
    )

    assert response.status_code == 403


def test_account_update_and_password_change():
    client = TestClient(app)
    client.post(
        "/api/auth/register",
        json={
            "email": "before@example.com",
            "password": "A-secure-passphrase",
            "full_name": "Before Name",
        },
    )

    updated = client.patch(
        "/api/auth/me",
        json={"email": "AFTER@example.com", "full_name": "After Name"},
    )
    assert updated.status_code == 200
    assert updated.json()["email"] == "after@example.com"
    assert updated.json()["full_name"] == "After Name"

    changed = client.post(
        "/api/auth/password",
        json={
            "current_password": "A-secure-passphrase",
            "new_password": "Another-secure-passphrase",
        },
    )
    assert changed.status_code == 200
    assert client.get("/api/auth/me").status_code == 401
    assert client.post(
        "/api/auth/login",
        json={"email": "after@example.com", "password": "A-secure-passphrase"},
    ).status_code == 401
    assert client.post(
        "/api/auth/login",
        json={"email": "after@example.com", "password": "Another-secure-passphrase"},
    ).status_code == 200


def test_account_deletion_removes_owned_personal_data():
    client = TestClient(app)
    client.post(
        "/api/auth/register",
        json={
            "email": "delete@example.com",
            "password": "A-secure-passphrase",
            "full_name": "Delete Candidate",
        },
    )
    assert client.post(
        "/api/candidates",
        json={
            "id": "CAND-DELETE",
            "full_name": "Delete Candidate",
            "country": "Senegal",
        },
    ).status_code == 201
    assert client.post(
        "/api/applications",
        json={"candidate_id": "CAND-DELETE", "job_id": "JOB-001"},
    ).status_code == 201
    assert client.post(
        "/api/job-analyses",
        json={
            "candidate_id": "CAND-DELETE",
            "job_text": "We are looking for a Python developer with practical experience.",
        },
    ).status_code == 201

    deleted = client.delete("/api/auth/me")
    assert deleted.status_code == 200
    assert client.get("/api/auth/me").status_code == 401
    assert client.post(
        "/api/auth/login",
        json={"email": "delete@example.com", "password": "A-secure-passphrase"},
    ).status_code == 401

    conn = get_connection()
    try:
        assert conn.execute(
            "SELECT 1 FROM users WHERE email = ?", ("delete@example.com",)
        ).fetchone() is None
        assert conn.execute(
            "SELECT 1 FROM candidates WHERE id = ?", ("CAND-DELETE",)
        ).fetchone() is None
        assert conn.execute(
            "SELECT 1 FROM applications WHERE candidate_id = ?", ("CAND-DELETE",)
        ).fetchone() is None
        assert conn.execute(
            "SELECT 1 FROM job_analyses WHERE candidate_id = ?", ("CAND-DELETE",)
        ).fetchone() is None
    finally:
        conn.close()
