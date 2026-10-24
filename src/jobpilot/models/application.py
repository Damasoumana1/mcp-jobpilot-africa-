from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class Application(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(description="Unique application identifier")
    candidate_id: str = Field(description="Identifier of the candidate")
    job_id: str = Field(description="Identifier of the job")
    status: str = Field(default="saved", description="Current status (e.g. saved, applied, interview, offer, rejected)")
    applied_at: str | None = Field(default=None, description="Timestamp of application submission")
    next_action: str | None = Field(default=None, description="Next pending action item")
    notes: str | None = Field(default=None, description="Personal notes or updates about the application")
