from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class Candidate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(description="Unique candidate identifier")
    full_name: str = Field(description="Full name of candidate")
    country: str = Field(description="Country of residence")
    city: str | None = Field(default=None, description="City of residence")
    email: str | None = Field(default=None, description="Candidate contact email")
    availability_date: str | None = Field(default=None, description="Earliest availability date")
    languages: str | None = Field(default=None, description="Spoken/written languages")
    education: str | None = Field(default=None, description="Education or academic degree")
    summary: str | None = Field(default=None, description="Brief professional summary")
    skills: list[str] = Field(default_factory=list, description="Skills possessed by the candidate")
