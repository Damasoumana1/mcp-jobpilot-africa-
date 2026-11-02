from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone

from jobpilot.database.connection import get_connection
from jobpilot.models.job_analysis import JobAnalysis, JobAnalysisRequest, SkillEvidence
from jobpilot.services.candidate_service import get_candidate
from jobpilot.services.resume_service import TECH_SKILLS_CATALOG


_ALIASES = {
    "golang": "Go", "go": "Go", "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL", "vue": "Vue.js", "vue.js": "Vue.js",
    "tailwind": "Tailwind CSS", "tailwind css": "Tailwind CSS",
    "mcp": "Model Context Protocol (MCP)",
    "model context protocol": "Model Context Protocol (MCP)",
    "model context protocol (mcp)": "Model Context Protocol (MCP)",
}


def _canonical(skill: str) -> str:
    return _ALIASES.get(skill.strip().casefold(), skill.strip()).casefold()


def analyze_job(request: JobAnalysisRequest, *, save: bool = False) -> JobAnalysis:
    """Explain explicit skill coverage without inferring experience or fetching URLs.

    Mentions are not classified as mandatory: negation, context and eligibility
    require human review. The original posting is retained with saved reports.
    """
    candidate = get_candidate(request.candidate_id)
    if candidate is None:
        raise ValueError(f"Candidate '{request.candidate_id}' not found")
    candidate_skills = {_canonical(s) for s in candidate["skills"]}
    # Include candidate-specific skills so the catalog is not the only vocabulary.
    catalog = sorted(set(TECH_SKILLS_CATALOG + candidate["skills"]), key=lambda s: (-len(s), s))
    evidence: dict[str, SkillEvidence] = {}
    for skill in catalog:
        if not skill.strip():
            continue
        match = re.search(rf"(?<![\w#+]){re.escape(skill)}(?![\w#+])", request.job_text, re.IGNORECASE)
        if match is None:
            continue
        key = _canonical(skill)
        if key in evidence:
            continue
        # Quote the matching line, bounded for readable reports.
        start = max(request.job_text.rfind("\n", 0, match.start()) + 1, match.start() - 100)
        end = request.job_text.find("\n", match.end())
        end = min(len(request.job_text) if end == -1 else end, match.end() + 100)
        name = _ALIASES.get(skill.casefold(), skill)
        evidence[key] = SkillEvidence(name=name, matched=key in candidate_skills,
                                     evidence=request.job_text[start:end].strip())
    skills = sorted(evidence.values(), key=lambda s: s.name.casefold())
    score = round(100 * sum(s.matched for s in skills) / len(skills)) if skills else None
    recommendation = ("insufficient_data" if score is None else "promising" if score >= 75
                      else "review" if score >= 40 else "low_coverage")
    report = JobAnalysis(
        candidate_id=request.candidate_id, job_text=request.job_text,
        title=request.title, company=request.company,
        source_url=str(request.source_url) if request.source_url else None,
        skills=skills, coverage_score=score, recommendation=recommendation,
        warnings=["keyword_only", "availability_unverified", "eligibility_unverified"],
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    if save:
        report.id = f"ANALYSIS-{uuid.uuid4().hex}"
        conn = get_connection()
        try:
            conn.execute("INSERT INTO job_analyses (id, candidate_id, created_at, report_json) VALUES (?, ?, ?, ?)",
                         (report.id, report.candidate_id, report.created_at, report.model_dump_json()))
            conn.commit()
        finally:
            conn.close()
    return report


def list_job_analyses(candidate_id: str) -> list[JobAnalysis]:
    if get_candidate(candidate_id) is None:
        raise ValueError(f"Candidate '{candidate_id}' not found")
    conn = get_connection()
    try:
        rows = conn.execute("SELECT report_json FROM job_analyses WHERE candidate_id = ? ORDER BY created_at DESC LIMIT 100",
                            (candidate_id,)).fetchall()
        return [JobAnalysis.model_validate(json.loads(row["report_json"])) for row in rows]
    finally:
        conn.close()
