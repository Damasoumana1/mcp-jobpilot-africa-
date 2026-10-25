from __future__ import annotations

from jobpilot.models.application import Application
from jobpilot.models.candidate import Candidate
from jobpilot.models.interview import ChecklistItem
from jobpilot.models.job import Job
from jobpilot.models.matching import MatchResult
from jobpilot.models.outreach import CoverLetter

__all__ = [
    "Application",
    "Candidate",
    "ChecklistItem",
    "CoverLetter",
    "Job",
    "MatchResult",
]
