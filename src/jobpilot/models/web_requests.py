from pydantic import BaseModel, ConfigDict, Field


class CandidateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    id: str = Field(min_length=1, max_length=100)
    full_name: str = Field(min_length=1, max_length=200)
    country: str = Field(min_length=1, max_length=100)
    city: str | None = None
    email: str | None = None
    availability_date: str | None = None
    languages: str | None = None
    education: str | None = None
    summary: str | None = None
    skills: list[str] = Field(default_factory=list)


class InterviewRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    candidate_id: str = Field(min_length=1)
    job_id: str = Field(min_length=1)
    number: int = Field(default=6, ge=1, le=12, strict=True)
