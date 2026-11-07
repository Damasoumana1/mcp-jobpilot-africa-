export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  country?: string;
  city?: string;
  remote?: boolean;
  remote_allowed?: boolean;
  required_skills?: string[];
  skills?: string[];
  nice_to_have?: string[];
  description?: string;
  status?: string;
  application_url?: string;
  source?: string;
  source_url?: string;
  source_location?: string;
  last_seen_at?: string;
}

export interface Candidate {
  id: string;
  name: string;
  full_name?: string;
  email: string;
  country: string;
  desired_role?: string;
  skills: string[];
  experience_years?: number;
  portfolio_url?: string;
  education?: string;
  bio?: string;
  summary?: string;
  available?: boolean;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected' | string;
  applied_at: string;
  notes?: string;
  job_title?: string;
  company?: string;
  next_action?: string | null;
  follow_up_date?: string | null;
}

export interface ApplicationUpdate {
  status?: string;
  next_action?: string | null;
  follow_up_date?: string | null;
}

export interface MatchResult {
  score: number;
  matched_skills: string[];
  missing_skills: string[];
  recommendation: string;
  candidate_id: string;
  job_id: string;
  breakdown?: {
    mandatory_score?: number;
    skills_score?: number;
    experience_score?: number;
    mobility_score?: number;
  };
}

export interface ChecklistItem {
  id: string;
  phase: string;
  task: string;
  why_it_matters: string;
  done?: boolean;
}

export interface CoverLetterResponse {
  job_id: string;
  candidate_id: string;
  cover_letter: string;
  email_subject: string;
  linkedin_pitch: string;
  key_highlights: string[];
}
