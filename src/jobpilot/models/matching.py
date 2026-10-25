from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class MatchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    candidate_id: str = Field(description="Candidate identifier")
    job_id: str = Field(description="Job identifier")
    match_score: int = Field(ge=0, le=100, description="Match percentage score between 0 and 100")
    matching_skills: list[str] = Field(description="List of skills shared by the candidate and job")
    missing_skills: list[str] = Field(description="List of skills required by the job but missing from candidate profile")
    recommendations: list[str] = Field(description="Actionable advice to bridge gaps or prepare for the role")
    relocation_needed: bool = Field(default=False, description="Whether the candidate needs to relocate for this on-site role")
    remote_compatible: bool = Field(default=True, description="Whether remote working or same country aligns")
    mandatory_skills_met: bool = Field(default=True, description="Whether all strictly required skills are satisfied")
