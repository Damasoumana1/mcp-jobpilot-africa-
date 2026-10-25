from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class CoverLetter(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    candidate_id: str = Field(description="Candidate identifier")
    job_id: str = Field(description="Job identifier")
    company: str = Field(description="Target company name")
    job_title: str = Field(description="Target job title")
    email_subject: str = Field(description="Punchy email subject line for job application")
    cover_letter: str = Field(description="Personalized cover letter tailored to the job and candidate background")
    linkedin_pitch: str = Field(description="Concise 2-3 sentence outreach pitch for LinkedIn / DM to the hiring team")
