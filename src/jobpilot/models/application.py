from __future__ import annotations

import re
from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class Application(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(description="Unique application identifier")
    candidate_id: str = Field(description="Identifier of the candidate")
    job_id: str = Field(description="Identifier of the job")
    status: str = Field(default="saved", description="Current status (e.g. saved, applied, interview, offer, rejected)")
    applied_at: str | None = Field(default=None, description="Timestamp of application submission")
    next_action: str | None = Field(default=None, description="Next pending action item")
    follow_up_date: str | None = Field(default=None, description="Follow-up calendar date in YYYY-MM-DD format")
    notes: str | None = Field(default=None, description="Personal notes or updates about the application")


class ApplicationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    status: Literal["saved", "applied", "interview", "offer", "rejected"] | None = None
    notes: str | None = Field(default=None, max_length=10000)
    next_action: str | None = Field(default=None, max_length=500)
    follow_up_date: str | None = None

    @field_validator("status")
    @classmethod
    def non_null_status(cls, value):
        if value is None:
            raise ValueError("status cannot be null")
        return value

    @field_validator("follow_up_date")
    @classmethod
    def calendar_date(cls, value):
        if value is not None:
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
                raise ValueError("follow_up_date must use YYYY-MM-DD")
            date.fromisoformat(value)
        return value

    @field_validator("next_action")
    @classmethod
    def empty_action(cls, value):
        return value or None

    @model_validator(mode="after")
    def non_empty_update(self):
        if not self.model_fields_set:
            raise ValueError("At least one update field is required")
        return self
