# MCP Tools Reference

JobPilot Africa exposes 12 tools via the Model Context Protocol to empower AI agents and candidate workflows:

---

## 1. Job Discovery & Recruiter Management

### `search_jobs`
Search tech opportunities across Africa by keyword, country, remote allowance, and contract duration.
* **Arguments:**
  * `keywords` (`list[str] | str | None`): Keywords to match against title or description.
  * `country` (`str | None`): Filter by country name (e.g. `"Burkina Faso"`, `"Senegal"`).
  * `remote_only` (`bool`, default: `False`): Filter only positions allowing remote work.
  * `min_duration_months` (`int | None`): Minimum contract duration in months.
* **Returns:** `list[Job]`

### `get_job`
Get complete details of a specific job, including its list of required skills.
* **Arguments:**
  * `job_id` (`str`): Unique job identifier (e.g. `"JOB-001"`).
* **Returns:** `Job`

### `create_job`
Register or update a job opportunity in the database (for recruiters or AI web scraping agents).
* **Arguments:**
  * `job_id` (`str`): Unique identifier for the job.
  * `title` (`str`): Job title.
  * `company` (`str`): Hiring company.
  * `country` (`str | None`): Country.
  * `remote_allowed` (`bool`): Remote eligibility.
  * `employment_type` (`str`): E.g. `internship`, `full-time`.
  * `duration_months` (`int | None`): Contract duration in months.
  * `compensation` (`str | None`): E.g. `Paid`, `Stipend`, `Competitive`.
  * `description` (`str | None`): Role description.
  * `application_url` (`str | None`): Direct application URL.
  * `closing_date` (`str | None`): Deadline.
  * `skills` (`list[str] | str | None`): Required skills.
* **Returns:** `Job`

---

## 2. Candidate Profiles & Skill Matching

### `get_candidate`
Retrieve full candidate profile including skills, availability, and background.
* **Arguments:**
  * `candidate_id` (`str`): Unique candidate identifier (e.g. `"DAMA-001"`).
* **Returns:** `Candidate`

### `register_candidate`
Create or update a candidate profile, with automatic skill registration.
* **Arguments:**
  * `candidate_id` (`str`): Identifier for the candidate.
  * `full_name` (`str`): Full name.
  * `country` (`str`): Country of residence.
  * `skills` (`list[str] | str | None`): List of skills.
* **Returns:** `Candidate`

### `match_candidate_to_job`
Weighted matching calculation taking into account mandatory vs optional skills, mobility/relocation, and targeted recommendations.
* **Arguments:**
  * `candidate_id` (`str`): Candidate identifier.
  * `job_id` (`str`): Job identifier.
* **Returns:** `MatchResult` (`match_score`, `matching_skills`, `missing_skills`, `recommendations`, `relocation_needed`, `remote_compatible`, `mandatory_skills_met`)

---

## 3. Application Lifecycle & Outreach

### `create_application`
Create a new tracked job application for a candidate.
* **Arguments:**
  * `candidate_id` (`str`): Candidate identifier.
  * `job_id` (`str`): Job identifier.
  * `status` (`str`, default: `"saved"`): Initial status (`saved`, `applied`, `interview`, `offer`, `rejected`).
* **Returns:** `Application`

### `update_application_status`
Update an application's progress and append interview or feedback notes.
* **Arguments:**
  * `application_id` (`str`): Application identifier.
  * `status` (`str`): Updated status.
  * `notes` (`str | None`): Interview feedback or personal follow-up notes.
* **Returns:** `Application`

### `list_applications`
List all tracked applications, optionally filtered for a specific candidate.
* **Arguments:**
  * `candidate_id` (`str | None`): Optional filter by candidate ID.
* **Returns:** `list[Application]`

### `generate_cover_letter`
Generate a tailored motivation cover letter, catchy email subject line, and concise LinkedIn outreach pitch.
* **Arguments:**
  * `candidate_id` (`str`): Candidate identifier.
  * `job_id` (`str`): Job identifier.
  * `tone` (`str`, default: `"professional"`): Tone of outreach.
* **Returns:** `CoverLetter` (`email_subject`, `cover_letter`, `linkedin_pitch`)

---

## 4. Interview Preparation & Coaching

### `generate_interview_questions`
Generate tailored technical and behavioral interview questions based on the candidate's background and the employer's job description.
* **Arguments:**
  * `candidate_id` (`str`): Candidate identifier.
  * `job_id` (`str`): Job identifier.
  * `question_type` (`str`, default: `"mixed"`): Question style (`technical`, `behavioral`, `mixed`).
  * `number` (`int`, default: `8`): Number of questions to generate.
* **Returns:** `list[str]`

### `get_application_checklist`
Return a personalized, prioritized action checklist before submitting or attending an interview.
* **Arguments:**
  * `candidate_id` (`str`): Candidate identifier.
  * `job_id` (`str`): Job identifier.
* **Returns:** `list[ChecklistItem]`
