from __future__ import annotations

import hashlib
import secrets
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone

from jobpilot.database.connection import get_connection


SESSION_DAYS = 7
PBKDF2_ITERATIONS = 200_000


def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("ascii"), PBKDF2_ITERATIONS
    )
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${digest.hex()}"


def _verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt, digest = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        candidate = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("ascii"),
            int(iterations),
        ).hex()
        return secrets.compare_digest(candidate, digest)
    except (ValueError, TypeError):
        return False


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _public_user(row) -> dict:
    return {
        "id": row["id"],
        "email": row["email"],
        "full_name": row["full_name"],
        "candidate_id": row["candidate_id"],
    }


def update_user(user_id: str, *, email: str | None = None, full_name: str | None = None) -> dict:
    if email is None and full_name is None:
        raise ValueError("At least one account field must be provided")
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not row:
            raise ValueError("Account not found")
        updated_email = email if email is not None else row["email"]
        updated_name = full_name if full_name is not None else row["full_name"]
        conn.execute(
            "UPDATE users SET email = ?, full_name = ? WHERE id = ?",
            (updated_email, updated_name, user_id),
        )
        conn.commit()
        updated = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return _public_user(updated)
    except sqlite3.IntegrityError as exc:
        raise ValueError("An account already exists for this email") from exc
    finally:
        conn.close()


def change_password(user_id: str, current_password: str, new_password: str) -> None:
    conn = get_connection()
    try:
        row = conn.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,)).fetchone()
        if not row or not _verify_password(current_password, row["password_hash"]):
            raise ValueError("Current password is incorrect")
        conn.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (_hash_password(new_password), user_id),
        )
        conn.execute("DELETE FROM user_sessions WHERE user_id = ?", (user_id,))
        conn.commit()
    finally:
        conn.close()


def delete_user(user_id: str) -> None:
    conn = get_connection()
    try:
        with conn:
            conn.execute("BEGIN IMMEDIATE")
            row = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
            if not row:
                raise ValueError("Account not found")

            conn.execute("DELETE FROM user_sessions WHERE user_id = ?", (user_id,))
            owned_candidates = conn.execute(
                "SELECT id FROM candidates WHERE owner_user_id = ?", (user_id,)
            ).fetchall()
            candidate_ids = {candidate["id"] for candidate in owned_candidates}

            for owned_candidate_id in candidate_ids:
                conn.execute("DELETE FROM candidate_skills WHERE candidate_id = ?", (owned_candidate_id,))
                conn.execute("DELETE FROM applications WHERE candidate_id = ?", (owned_candidate_id,))
                conn.execute("DELETE FROM job_analyses WHERE candidate_id = ?", (owned_candidate_id,))
                conn.execute(
                    "UPDATE users SET candidate_id = NULL WHERE candidate_id = ?",
                    (owned_candidate_id,),
                )
                conn.execute("DELETE FROM candidates WHERE id = ?", (owned_candidate_id,))

            conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    finally:
        conn.close()


def register_user(email: str, password: str, full_name: str) -> dict:
    conn = get_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?", (email.lower(),)
        ).fetchone()
        if existing:
            raise ValueError("An account already exists for this email")

        user_id = f"USR-{uuid.uuid4().hex[:12].upper()}"
        now = _utc_now().isoformat()
        try:
            conn.execute(
                """
                INSERT INTO users (id, email, password_hash, full_name, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (user_id, email.lower(), _hash_password(password), full_name, now),
            )
        except sqlite3.IntegrityError as exc:
            raise ValueError("An account already exists for this email") from exc
        conn.commit()
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return _public_user(row)
    finally:
        conn.close()


def create_session(email: str, password: str) -> tuple[dict, str, datetime]:
    conn = get_connection()
    try:
        row = conn.execute(
            """
            SELECT * FROM users
            WHERE email = ? AND is_active = TRUE AND deleted_at IS NULL
            """,
            (email.lower(),),
        ).fetchone()
        if not row or not _verify_password(password, row["password_hash"]):
            raise ValueError("Invalid email or password")

        token = secrets.token_urlsafe(48)
        token_hash = hashlib.sha256(token.encode("ascii")).hexdigest()
        now = _utc_now()
        expires = now + timedelta(days=SESSION_DAYS)
        conn.execute(
            """
            INSERT INTO user_sessions (token_hash, user_id, created_at, expires_at)
            VALUES (?, ?, ?, ?)
            """,
            (token_hash, row["id"], now.isoformat(), expires.isoformat()),
        )
        conn.commit()
        return _public_user(row), token, expires
    finally:
        conn.close()


def get_session_user(token: str | None) -> dict | None:
    if not token:
        return None
    try:
        token_hash = hashlib.sha256(token.encode("ascii")).hexdigest()
    except UnicodeEncodeError:
        return None
    conn = get_connection()
    try:
        row = conn.execute(
            """
            SELECT u.*
            FROM user_sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token_hash = ?
              AND s.expires_at > ?
              AND u.is_active = TRUE
              AND u.deleted_at IS NULL
            """,
            (token_hash, _utc_now().isoformat()),
        ).fetchone()
        return _public_user(row) if row else None
    finally:
        conn.close()


def delete_session(token: str | None) -> None:
    if not token:
        return
    try:
        token_hash = hashlib.sha256(token.encode("ascii")).hexdigest()
    except UnicodeEncodeError:
        return
    conn = get_connection()
    try:
        conn.execute("DELETE FROM user_sessions WHERE token_hash = ?", (token_hash,))
        conn.commit()
    finally:
        conn.close()
