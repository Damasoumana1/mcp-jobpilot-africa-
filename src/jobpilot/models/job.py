from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class Job(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(description="Unique identifier for the job offer")
    title: str = Field(description="Job title")
    company: str = Field(description="Hiring company or organization")
    country: str | None = Field(default=None, description="Country where the position is located")
    remote_allowed: bool = Field(default=False, description="Whether remote work is allowed")
    employment_type: str | None = Field(default=None, description="Employment type (e.g. internship, full-time)")
    duration_months: int | None = Field(default=None, description="Contract duration in months")
    compensation: str | None = Field(default=None, description="Compensation information")
    description: str | None = Field(default=None, description="Role summary and responsibilities")
    application_url: str | None = Field(default=None, description="Direct URL to apply")
    closing_date: str | None = Field(default=None, description="Application deadline date")
    skills: list[str] = Field(default_factory=list, description="List of required or relevant skills")
