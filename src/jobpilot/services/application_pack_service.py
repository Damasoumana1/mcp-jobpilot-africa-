"""Preview and download application documents without submitting an application."""
from __future__ import annotations

import io
import zipfile
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from jobpilot.services.application_service import generate_cover_letter
from jobpilot.services.candidate_service import get_candidate
from jobpilot.services.job_service import get_job
from jobpilot.services.matching_service import match_candidate_to_job

FILE_NAMES = {
    "fr": ["lettre-motivation.txt", "email-et-pitch.txt", "checklist.txt", "offre-et-competences.txt"],
    "en": ["cover-letter.txt", "email-and-pitch.txt", "checklist.txt", "job-and-skills.txt"],
}


class PackRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    candidate_id: str = Field(min_length=1, max_length=100)
    job_id: str = Field(min_length=1, max_length=200)
    language: Literal["fr", "en"] = "fr"


class PackFile(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(max_length=100)
    content: str = Field(max_length=100000)


class PackDownload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    language: Literal["fr", "en"]
    files: list[PackFile] = Field(min_length=4, max_length=4)

    @model_validator(mode="after")
    def safe_names(self):
        if sorted(file.name for file in self.files) != sorted(FILE_NAMES[self.language]):
            raise ValueError("Unexpected or duplicate archive filenames")
        return self


def prepare_application_pack(request: PackRequest) -> dict:
    candidate = get_candidate(request.candidate_id)
    job = get_job(request.job_id)
    if candidate is None or job is None:
        raise LookupError("Candidate or job not found")
    fr = request.language == "fr"
    letter = generate_cover_letter(request.candidate_id, request.job_id, language=request.language)
    match = match_candidate_to_job(request.candidate_id, request.job_id)
    tasks = ([
        "Vérifier les coordonnées et les affirmations de la lettre et du pitch.",
        "Adapter le CV aux compétences demandées sans inventer d’expérience.",
        "Préparer deux exemples de projets et une présentation de deux minutes.",
        "Vérifier la disponibilité de l’annonce et les critères de pays et de télétravail.",
        "Envoyer la candidature via le canal indiqué par l’employeur.",
        "Enregistrer le suivi et planifier une relance dans JobPilot.",
    ] if fr else [
        "Check contact details and the claims in the cover letter and pitch.",
        "Tailor the CV to the required skills without inventing experience.",
        "Prepare two project examples and a two-minute introduction.",
        "Check the posting is still open and verify country and remote eligibility.",
        "Submit through the employer's stated application channel.",
        "Record tracking and schedule a follow-up in JobPilot.",
    ])
    missing = ", ".join(match["missing_skills"]) or ("Aucune détectée" if fr else "None detected")
    matched = ", ".join(match["matching_skills"]) or ("Aucune détectée" if fr else "None detected")
    if not job.get("skills"):
        missing = matched = ("Non évaluées : aucune compétence renseignée dans l’annonce" if fr else "Not evaluated: no skills supplied in the posting")
    summary = (f"{'Profil' if fr else 'Profile'} : {candidate['full_name']}\n"
               f"{'Offre' if fr else 'Job'} : {job['title']}\n"
               f"{'Entreprise' if fr else 'Company'} : {job['company']}\n"
               f"{'Localisation publiée' if fr else 'Published location'} : {job.get('source_location') or job.get('country') or '—'}\n"
               f"{'Lien employeur' if fr else 'Employer link'} : {job.get('application_url') or '—'}\n"
               f"Source : {job.get('source') or ('Locale / démonstration' if fr else 'Local / demo')}\n"
               f"{'Dernière collecte' if fr else 'Last collected'} : {job.get('last_seen_at') or '—'}\n\n"
               f"{'Compétences communes' if fr else 'Matching skills'} : {matched}\n"
               f"{'Compétences à renforcer' if fr else 'Skills to strengthen'} : {missing}\n\n"
               f"{'Description (20 000 caractères maximum)' if fr else 'Description (maximum 20,000 characters)'}\n{(job.get('description') or '')[:20000]}\n\n"
               + ("Comparaison par mentions de compétences, sans garantie d’éligibilité ou de recrutement. Vérifiez les documents avant utilisation. Ce pack ne constitue pas un envoi de candidature."
                  if fr else "Skill mention comparison does not guarantee eligibility or recruitment. Review these drafts before use. This pack does not submit an application."))
    contents = [letter["cover_letter"],
                f"{'Objet' if fr else 'Subject'} : {letter['email_subject']}\n\nLinkedIn\n{letter['linkedin_pitch']}",
                "\n".join(f"[ ] {task}" for task in tasks), summary]
    files = [{"name": name, "content": content} for name, content in zip(FILE_NAMES[request.language], contents)]
    PackDownload(language=request.language, files=files)
    return {"candidate_id": request.candidate_id, "job_id": request.job_id,
            "candidate_name": candidate["full_name"], "job_title": job["title"],
            "language": request.language, "files": files}


def build_pack_zip(pack: PackDownload) -> bytes:
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file in pack.files:
            archive.writestr(file.name, file.content.encode("utf-8"))
    return output.getvalue()
