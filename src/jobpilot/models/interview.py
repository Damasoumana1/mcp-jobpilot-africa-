from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ChecklistItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    task: str = Field(description="Action item to prepare")
    priority: str = Field(description="Priority level: high, medium, low")
    completed: bool = Field(default=False, description="Whether the preparation step has been completed")
