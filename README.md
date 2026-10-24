# MCP JobPilot Africa

[![CI](https://github.com/Damasoumana1/mcp-jobpilot-africa-/actions/workflows/ci.yml/badge.svg)](https://github.com/Damasoumana1/mcp-jobpilot-africa-/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python: >=3.10](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![FastMCP](https://img.shields.io/badge/MCP-FastMCP_v2-purple.svg)](https://github.com/jlowin/fastmcp)

**MCP JobPilot Africa** is an AI-powered Model Context Protocol (MCP) server designed to match African early-career talent with tech internships and job opportunities. It equips AI agents with tools for discovery, profile matching, gap analysis, application tracking, and interview coaching.

---

## 🎯 Features

- **Job Discovery**: Search tech opportunities across Africa by keyword, country, remote allowance, and contract duration.
- **Skill Matching & Gap Analysis**: Match candidate profiles against job prerequisites, compute match scores (0–100%), and receive targeted learning recommendations.
- **Application Tracking**: Create and maintain candidate job applications with custom notes and status lifecycles (`saved`, `applied`, `interview`, `offer`, `rejected`).
- **Interview Preparation**: Generate contextual technical and behavioral interview questions tailored to the candidate's profile and the employer's stack.
- **Preparation Checklist**: Generate an actionable, prioritized preparation plan for upcoming interviews.

---

## 📂 Project Structure

```text
mcp-jobpilot-africa/
├── data/                  # Demo JSON profiles and local SQLite storage
│   ├── candidates.json
│   └── jobs.json
├── docs/                  # Architecture & Tool documentation
│   ├── architecture.md
│   └── tools.md
├── src/
│   └── jobpilot/
│       ├── database/      # SQLite connection, schema, and demo seed
│       ├── models/        # Pydantic v2 schemas (Job, Candidate, Application, MatchResult, ...)
│       ├── services/      # Business logic (matching, job search, interview prep)
│       ├── tools/         # FastMCP tools
│       ├── mcp_app.py     # Shared FastMCP server instance
│       └── server.py      # Entrypoint & CLI runner (stdio, sse, http)
└── tests/                 # Isolated pytest suite with dynamic SQLite fixtures
```

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/Damasoumana1/mcp-jobpilot-africa-.git
cd mcp-jobpilot-africa-

# Create and activate virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install in editable mode
pip install -e .
```

### 2. Run the Server

#### Standard IO (`stdio` - Recommended for Claude Desktop / Cursor / Cline):
```bash
python -m jobpilot.server
```

#### Server-Sent Events (`sse`):
```bash
python -m jobpilot.server --transport sse --host 127.0.0.1 --port 8000
```

#### Interactive Web Dashboard:
```bash
python -m jobpilot.server --web
# Ou directement :
python -m jobpilot.web
```
Ouvrez ensuite votre navigateur sur **http://localhost:8000** pour explorer les offres, tester le matching en direct, suivre vos candidatures et générer vos questions d'entretien.

#### FastMCP Dev Inspector:
```bash
fastmcp dev inspector src/jobpilot/server.py:mcp
```

---

## 🔌 Connecting to Claude Desktop / Cursor

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "jobpilot-africa": {
      "command": "python",
      "args": [
        "-m",
        "jobpilot.server"
      ],
      "cwd": "C:/Users/user/Desktop/mcp-jobpilot-africa"
    }
  }
}
```

---

## 🛠️ MCP Tools Overview (10 Tools)

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `search_jobs` | `keywords`, `country`, `remote_only`, `min_duration_months` | Search tech opportunities with filtering. |
| `get_job` | `job_id` | Retrieve complete job details and required skills. |
| `get_candidate` | `candidate_id` | Retrieve full candidate profile including skills. |
| `register_candidate` | `candidate_id`, `full_name`, `country`, `skills`, ... | Create or update candidate profile and skills. |
| `match_candidate_to_job` | `candidate_id`, `job_id` | Calculate match score, common skills, gaps, and recommendations. |
| `create_application` | `candidate_id`, `job_id`, `status` | Create a tracked application record. |
| `update_application_status` | `application_id`, `status`, `notes` | Update application progress and notes. |
| `list_applications` | `candidate_id` | List tracked applications for a candidate. |
| `generate_interview_questions` | `candidate_id`, `job_id`, `question_type`, `number` | Generate targeted technical and behavioral questions. |
| `get_application_checklist` | `candidate_id`, `job_id` | Generate a prioritized preparation checklist. |

---

## 🧪 Running Tests

The test suite runs with fully isolated, temporary SQLite databases:

```bash
pytest -v
```

---

## 📄 License

MIT
