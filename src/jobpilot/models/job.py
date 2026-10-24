from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Job:
    id: str
    title: str
    company: str
    country: str | None = None
    remote_allowed: bool = False
    employment_type: str | None = None
    duration_months: int | None = None
    compensation: str | None = None
    description: str | None = None
    application_url: str | None = None
    closing_date: str | None = None
    skills: list[str] = field(default_factory=list)
