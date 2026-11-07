CREATE TABLE IF NOT EXISTS job_analyses (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    report_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS job_sources (
    job_id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    board TEXT NOT NULL,
    external_id TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_location TEXT NOT NULL,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    UNIQUE(provider, board, external_id)
);
CREATE INDEX IF NOT EXISTS idx_job_analyses_candidate ON job_analyses(candidate_id, created_at);

CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT,
    email TEXT,
    availability_date TEXT,
    languages TEXT,
    education TEXT,
    summary TEXT
);

CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS candidate_skills (
    candidate_id TEXT NOT NULL,
    skill_id INTEGER NOT NULL,
    level TEXT NOT NULL,
    years_experience REAL DEFAULT 0,
    PRIMARY KEY (candidate_id, skill_id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);

CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    country TEXT,
    remote_allowed BOOLEAN DEFAULT FALSE,
    employment_type TEXT,
    duration_months INTEGER,
    compensation TEXT,
    description TEXT,
    application_url TEXT,
    closing_date TEXT
);

CREATE TABLE IF NOT EXISTS job_skills (
    job_id TEXT NOT NULL,
    skill_id INTEGER NOT NULL,
    required_level TEXT,
    is_required BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (job_id, skill_id),
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);

CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'saved',
    applied_at TEXT,
    next_action TEXT,
    follow_up_date TEXT,
    notes TEXT,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);
