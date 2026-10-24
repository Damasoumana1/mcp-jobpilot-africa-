# MCP JobPilot Africa

MCP JobPilot Africa is a local MVP for an AI-powered job matching server for African early-career opportunities.

## Goals

- Search internship and early-career opportunities from a local database
- Match a candidate profile to a job opportunity
- Track applications
- Prepare interview questions
- Return a personalized application checklist

## Project structure

- `src/jobpilot` contains the server, database layer, services, and MCP tools
- `data` contains the local data and demo database
- `tests` contains MVP validation tests
- `docs` contains architecture and tool documentation

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
python -m jobpilot.server
```

## MVP features

- `search_jobs`
- `get_job`
- `match_candidate_to_job`
- `create_application`
- `update_application_status`
- `generate_interview_questions`
- `get_application_checklist`
