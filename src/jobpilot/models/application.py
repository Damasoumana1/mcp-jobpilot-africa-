from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Application:
    id: str
    candidate_id: str
    job_id: str
    status: str = "saved"
    applied_at: str | None = None
    next_action: str | None = None
    notes: str | None = None
