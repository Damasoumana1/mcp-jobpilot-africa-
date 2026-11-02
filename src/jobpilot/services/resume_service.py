from __future__ import annotations

import re
from typing import Any

from jobpilot.services.candidate_service import get_candidate, upsert_candidate
from jobpilot.geography import detect_country

# Comprehensive tech skills dictionary categorized for African & global tech markets
TECH_SKILLS_CATALOG = [
    # Languages
    "Python", "JavaScript", "TypeScript", "Go", "Golang", "Java", "Kotlin", "Swift",
    "Rust", "PHP", "C++", "C#", "Ruby", "SQL", "HTML", "CSS", "Bash", "Shell",
    # Frontend & Mobile
    "React", "React Native", "Next.js", "Vue.js", "Vue", "Angular", "Tailwind CSS",
    "Tailwind", "Bootstrap", "Flutter", "Dart", "Android", "iOS", "Redux", "Vite",
    # Backend & Frameworks
    "FastAPI", "Django", "Flask", "Node.js", "Express", "NestJS", "Spring Boot",
    "Spring", "Laravel", "Symfony", "ASP.NET", "GraphQL", "REST API", "gRPC", "FastMCP",
    # Databases & Caches
    "PostgreSQL", "Postgres", "MySQL", "MongoDB", "SQLite", "Redis", "Elasticsearch",
    "Cassandra", "DynamoDB", "Firebase", "Supabase",
    # DevOps, Cloud & Infra
    "Docker", "Kubernetes", "AWS", "Google Cloud", "GCP", "Azure", "CI/CD", "Git",
    "GitHub Actions", "GitLab CI", "Terraform", "Ansible", "Linux", "Nginx",
    # AI, ML & Data
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy",
    "Scikit-Learn", "OpenCV", "NLP", "LLM", "LangChain", "Model Context Protocol",
    "MCP", "Data Analysis", "Power BI", "Tableau",
    # Methodologies & Tools
    "Agile", "Scrum", "Jira", "Postman", "Figma", "Unit Testing", "Pytest", "Jest"
]

COMMON_LANGUAGES = [
    "Français", "French", "Anglais", "English", "Arabe", "Arabic",
    "Wolof", "Swahili", "Portugais", "Portuguese", "Yoruba", "Igbo", "Hausa"
]


def extract_skills_from_text(text: str) -> list[str]:
    """Identify matching tech skills from text using boundary-safe regex."""
    found_skills: set[str] = set()
    text_lower = text.lower()

    for skill in TECH_SKILLS_CATALOG:
        # Boundary matching: handle special characters in skills like C++, C#, .NET
        escaped_skill = re.escape(skill.lower())
        pattern = rf"(?<![a-zA-Z0-9_#+]){escaped_skill}(?![a-zA-Z0-9_#+])"
        if re.search(pattern, text_lower):
            # Normalize naming
            norm_skill = skill
            if skill.lower() in ("golang", "go"):
                norm_skill = "Go"
            elif skill.lower() in ("postgres", "postgresql"):
                norm_skill = "PostgreSQL"
            elif skill.lower() in ("vue", "vue.js"):
                norm_skill = "Vue.js"
            elif skill.lower() in ("tailwind", "tailwind css"):
                norm_skill = "Tailwind CSS"
            elif skill.lower() == "mcp":
                norm_skill = "Model Context Protocol (MCP)"
            found_skills.add(norm_skill)

    # Return sorted skills
    return sorted(list(found_skills), key=lambda s: s.lower())


def extract_contact_info(text: str) -> dict[str, str | None]:
    """Extract email, phone, and potential location from resume text."""
    # Email
    email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    email = email_match.group(0) if email_match else None

    # Phone (African & international patterns)
    phone_match = re.search(r"(\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{0,4})", text)
    phone = phone_match.group(0).strip() if phone_match else None

    # Country
    detected_country = detect_country(text)

    return {
        "email": email,
        "phone": phone,
        "country": detected_country or "Afrique",
    }


def extract_languages(text: str) -> list[str]:
    """Extract spoken languages from resume."""
    detected = set()
    for lang in COMMON_LANGUAGES:
        if re.search(rf"\b{re.escape(lang)}\b", text, re.IGNORECASE):
            # Normalize
            if lang.lower() in ("français", "french"):
                detected.add("Français")
            elif lang.lower() in ("anglais", "english"):
                detected.add("Anglais")
            elif lang.lower() in ("arabe", "arabic"):
                detected.add("Arabe")
            else:
                detected.add(lang.capitalize())
    return sorted(list(detected))


def extract_experience_years(text: str) -> int:
    """Estimate experience years from text patterns."""
    # Pattern: "X ans d'expérience", "X years of experience"
    exp_match = re.search(r"(\d+)\s*(?:\+?\s*)?(?:ans|années|years)\s*(?:d'expérience|of experience|exp)?", text, re.IGNORECASE)
    if exp_match:
        try:
            return min(int(exp_match.group(1)), 25)
        except ValueError:
            pass

    # Pattern: count distinct employment year spans (e.g. 2022 - 2024)
    year_ranges = re.findall(r"(20[0-2][0-9])\s*[-–—]\s*(20[0-2][0-9]|présent|present|actuel)", text, re.IGNORECASE)
    if year_ranges:
        total_years = 0
        current_year = 2026
        for start, end in year_ranges:
            start_y = int(start)
            end_y = current_year if any(k in end.lower() for k in ["présent", "present", "actuel"]) else int(end)
            diff = max(0, end_y - start_y)
            total_years += diff
        return min(max(1, total_years), 25)

    return 1  # Default to junior / early-career


def extract_education(text: str) -> str:
    """Identify highest education degree mentioned."""
    degrees = [
        ("Doctorat / Ph.D en Informatique", [r"doctorat", r"ph\.?d"]),
        ("Master / Diplôme d'Ingénieur", [r"master", r"ingénieur", r"bac\s*\+\s*5", r"msc"]),
        ("Licence / Bachelor en Informatique", [r"licence", r"bachelor", r"bac\s*\+\s*3", r"bsc"]),
        ("DUT / BTS / Bac+2 Informatique", [r"dut", r"bts", r"bac\s*\+\s*2", r"deug"]),
        ("Formation Intensive / Bootcamp Développeur", [r"bootcamp", r"autodidacte", r"certification"]),
    ]
    for label, patterns in degrees:
        for p in patterns:
            if re.search(rf"\b{p}\b", text, re.IGNORECASE):
                return label
    return "Formation Supérieure en Informatique & Technologies"


def parse_resume(
    resume_text: str,
    candidate_id: str | None = None,
    auto_save: bool = False,
) -> dict[str, Any]:
    """Parse resume text, extract structured profile data, and optionally save to database."""
    if not resume_text or not resume_text.strip():
        raise ValueError("Resume text cannot be empty.")

    clean_text = resume_text.strip()

    # 1. Extract contact & demographics
    contact = extract_contact_info(clean_text)

    # Extract name (heuristic: first non-empty line or explicit "Nom:")
    lines = [line.strip() for line in clean_text.splitlines() if line.strip()]
    full_name = None
    for line in lines[:5]:
        nom_match = re.search(r"^(?:nom\s*:?|name\s*:?)\s*(.+)$", line, re.IGNORECASE)
        if nom_match:
            full_name = nom_match.group(1).strip()
            break
    if not full_name and lines:
        first_line = lines[0]
        # Ignore markdown headers or generic words
        cleaned_first = re.sub(r"^[#\s*\-–]+", "", first_line).strip()
        if len(cleaned_first.split()) <= 4 and not any(w in cleaned_first.lower() for w in ["cv", "resume", "curriculum", "développeur", "developer"]):
            full_name = cleaned_first

    # 2. Extract technical skills
    skills = extract_skills_from_text(clean_text)

    # 3. Extract languages, experience and education
    languages_list = extract_languages(clean_text)
    languages_str = ", ".join(languages_list) if languages_list else "Français, Anglais"
    experience_years = extract_experience_years(clean_text)
    education = extract_education(clean_text)

    # 4. Summary / Bio snippet
    summary = None
    for i, line in enumerate(lines[:10]):
        if re.search(r"(?:profil|résumé|summary|bio|à propos)\s*:", line, re.IGNORECASE):
            summary = line.split(":", 1)[-1].strip()
            if not summary and i + 1 < len(lines):
                summary = lines[i + 1]
            break
    if not summary and len(lines) > 2:
        # Fallback summary
        summary = f"Développeur tech qualifié avec expertise en {', '.join(skills[:4]) if skills else 'développement logiciel'}."

    parsed_result = {
        "candidate_id": candidate_id or "DAMA-001",
        "full_name": full_name or "Profil Candidat",
        "email": contact["email"] or "contact.candidat@jobpilot-africa.org",
        "country": contact["country"],
        "skills": skills,
        "skills_count": len(skills),
        "experience_years": experience_years,
        "education": education,
        "languages": languages_str,
        "summary": summary,
        "auto_saved": False,
    }

    # 5. Optionally auto-save to SQLite database
    if auto_save:
        target_id = candidate_id or "DAMA-001"
        existing = get_candidate(target_id)
        
        # Merge skills with existing ones if present
        existing_skills = existing.get("skills", []) if existing else []
        merged_skills = sorted(list(set(existing_skills + skills)))

        saved_candidate = upsert_candidate(
            candidate_id=target_id,
            full_name=full_name or (existing.get("full_name") if existing else "Dama Soumana"),
            country=contact["country"] or (existing.get("country") if existing else "Sénégal"),
            email=contact["email"] or (existing.get("email") if existing else None),
            languages=languages_str,
            education=education,
            summary=summary,
            skills=merged_skills,
        )
        parsed_result["auto_saved"] = True
        parsed_result["saved_candidate"] = saved_candidate

    return parsed_result
