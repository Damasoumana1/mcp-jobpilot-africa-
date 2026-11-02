"""Read-only Greenhouse discovery with explicit, transactional local import."""
from __future__ import annotations

import argparse
import html
import json
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.request import HTTPRedirectHandler, build_opener

from pydantic import BaseModel, ConfigDict, Field, StrictBool

from jobpilot.database.connection import get_connection
from jobpilot.geography import detect_country, resolve_country
from jobpilot.services.resume_service import extract_skills_from_text


class GreenhouseRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    board: str = Field(pattern=r"^[a-zA-Z0-9_-]{1,100}$")
    company: str = Field(min_length=1, max_length=300)
    save: StrictBool = False


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("Unexpected source redirect")


class _Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data):
        self.parts.append(data)


def _plain_text(value: str) -> str:
    parser = _Text()
    parser.feed(html.unescape(value))
    return " ".join(" ".join(parser.parts).split())


def _fetch_board(board: str) -> dict:
    url = f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs?content=true"
    try:
        with build_opener(_NoRedirect()).open(url, timeout=15) as response:
            raw = response.read(5_000_001)
        if len(raw) > 5_000_000:
            raise ValueError("Source response exceeds 5 MB")
        return json.loads(raw)
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError("Unable to read Greenhouse board; no local data changed") from exc


def import_greenhouse(request: GreenhouseRequest) -> dict:
    """Preview AU-country postings; save only when explicitly requested.

    Geography comes only from the posting location, never the employer's name or
    description. Remote-only locations without a named African country are skipped.
    Missing postings are not marked closed: this import does not verify closures.
    """
    payload = _fetch_board(request.board)
    if not isinstance(payload, dict) or not isinstance(payload.get("jobs"), list):
        raise ValueError("Invalid source response; no local data changed")
    now = datetime.now(timezone.utc).isoformat()
    offers = []
    seen: set[str] = set()
    skipped = 0
    for raw in payload["jobs"]:
        if not isinstance(raw, dict):
            raise ValueError("Invalid job record; no local data changed")
        external_id = raw.get("id")
        if isinstance(external_id, bool) or not isinstance(external_id, (int, str)) or not re.fullmatch(r"[0-9]+", str(external_id)):
            raise ValueError("Invalid source job ID; no local data changed")
        job_id = f"GH-{request.board.lower()}-{external_id}"
        if job_id in seen:
            continue
        seen.add(job_id)
        location = raw.get("location")
        location = location.get("name", "") if isinstance(location, dict) else ""
        if not isinstance(location, str):
            raise ValueError("Invalid source location; no local data changed")
        country = resolve_country(detect_country(location))
        if country is None:
            skipped += 1
            continue
        title, content, url = raw.get("title"), raw.get("content", ""), raw.get("absolute_url")
        if not isinstance(title, str) or not title.strip() or not isinstance(content, str):
            raise ValueError("Invalid source job content; no local data changed")
        if not isinstance(url, str) or not url.startswith("https://"):
            raise ValueError("Invalid application URL; no local data changed")
        description = _plain_text(content)
        offers.append({
            "id": job_id, "title": title.strip(), "company": request.company,
            "country": country["en"], "remote_allowed": bool(re.search(r"\bremote\b|télétravail", location, re.I)),
            "description": description, "application_url": url,
            "skills": extract_skills_from_text(description),
            "source": "greenhouse", "source_board": request.board.lower(),
            "external_id": str(external_id), "source_location": location,
            "source_url": f"https://boards-api.greenhouse.io/v1/boards/{request.board}/jobs/{external_id}",
            "last_seen_at": now,
        })
    if request.save:
        conn = get_connection()
        try:
            with conn:
                for job in offers:
                    existing = conn.execute("SELECT 1 FROM jobs WHERE id = ?", (job["id"],)).fetchone()
                    owned = conn.execute("SELECT 1 FROM job_sources WHERE job_id = ?", (job["id"],)).fetchone()
                    if existing and not owned:
                        raise ValueError("Imported ID conflicts with a local job; no local data changed")
                    conn.execute("""INSERT INTO jobs (id,title,company,country,remote_allowed,description,application_url)
                        VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,
                        company=excluded.company,country=excluded.country,remote_allowed=excluded.remote_allowed,
                        description=excluded.description,application_url=excluded.application_url""",
                        tuple(job[k] for k in ("id", "title", "company", "country", "remote_allowed", "description", "application_url")))
                    conn.execute("DELETE FROM job_skills WHERE job_id = ?", (job["id"],))
                    for skill in job["skills"]:
                        conn.execute("INSERT OR IGNORE INTO skills(name,category) VALUES (?, 'technical')", (skill,))
                        conn.execute("""INSERT INTO job_skills(job_id,skill_id,required_level,is_required)
                            SELECT ?,id,'unknown',0 FROM skills WHERE name=?""", (job["id"], skill))
                    conn.execute("""INSERT INTO job_sources(job_id,provider,board,external_id,source_url,source_location,first_seen_at,last_seen_at)
                        VALUES (?,'greenhouse',?,?,?,?,?,?) ON CONFLICT(job_id) DO UPDATE SET
                        source_url=excluded.source_url,source_location=excluded.source_location,last_seen_at=excluded.last_seen_at""",
                        tuple(job[k] for k in ("id", "source_board", "external_id", "source_url", "source_location")) + (now, now))
        finally:
            conn.close()
    return {"provider": "greenhouse", "board": request.board, "saved": request.save,
            "fetched": len(payload["jobs"]), "eligible": len(offers), "skipped_location": skipped,
            "offers": offers, "warnings": ["Location-based selection is not an eligibility check.",
            "All seniority levels are included; skill mentions are not mandatory requirements.",
            "Listed at collection time; continued availability is not guaranteed."]}


if __name__ == "__main__":
    from jobpilot.database.connection import init_db

    parser = argparse.ArgumentParser(description="Preview/import a public Greenhouse board")
    parser.add_argument("--board", required=True)
    parser.add_argument("--company", required=True)
    parser.add_argument("--save", action="store_true")
    args = parser.parse_args()
    init_db()
    print(json.dumps(import_greenhouse(GreenhouseRequest(**vars(args))), ensure_ascii=False, indent=2))
