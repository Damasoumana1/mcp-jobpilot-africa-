from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Candidate:
    id: str
    full_name: str
    country: str
    city: str | None = None
    email: str | None = None
    availability_date: str | None = None
    languages: str | None = None
    education: str | None = None
    summary: str | None = None
    skills: list[str] = field(default_factory=list)
