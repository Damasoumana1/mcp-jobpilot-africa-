from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class JobAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    candidate_id: str = Field(min_length=1, max_length=200)
    job_text: str = Field(min_length=30, max_length=20000)
    title: str = Field(default="", max_length=300)
    company: str = Field(default="", max_length=300)
    source_url: HttpUrl | None = None

    @field_validator("source_url")
    @classmethod
    def https_only(cls, value: HttpUrl | None) -> HttpUrl | None:
        if value is not None and value.scheme != "https":
            raise ValueError("Source URL must use HTTPS")
        return value


class SkillEvidence(BaseModel):
    name: str
    matched: bool
    evidence: str


class JobAnalysis(BaseModel):
    id: str | None = None
    candidate_id: str
    job_text: str
    title: str
    company: str
    source_url: str | None
    skills: list[SkillEvidence]
    coverage_score: int | None
    recommendation: Literal["promising", "review", "low_coverage", "insufficient_data"]
    warnings: list[str]
    method: Literal["keyword_rules"] = "keyword_rules"
    created_at: str
