from __future__ import annotations

import json
from pathlib import Path

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import HTMLResponse, JSONResponse, Response
from starlette.routing import Mount, Route
from starlette.staticfiles import StaticFiles

from jobpilot.database.connection import init_db
from jobpilot.database.seed import seed_demo_data
from jobpilot.services.application_service import (
    create_application,
    generate_cover_letter,
    list_applications,
    update_application_status,
)
from jobpilot.services.candidate_service import get_candidate, list_candidates, upsert_candidate
from jobpilot.services.interview_service import generate_interview_questions, get_application_checklist
from jobpilot.services.job_service import create_job, get_job, search_jobs
from jobpilot.services.matching_service import match_candidate_to_job

STATIC_DIR = Path(__file__).resolve().parent / "static"


async def index(request: Request) -> Response:
    """Serve the single page application HTML."""
    html_file = STATIC_DIR / "index.html"
    return HTMLResponse(html_file.read_text(encoding="utf-8"))


async def api_jobs(request: Request) -> JSONResponse:
    if request.method == "GET":
        country = request.query_params.get("country")
        if country == "all":
            country = None
        remote_only = request.query_params.get("remote_only") == "true"
        keywords_param = request.query_params.get("keywords")
        keywords = [k.strip() for k in keywords_param.split(",") if k.strip()] if keywords_param else None

        jobs = search_jobs(keywords=keywords, country=country, remote_only=remote_only)
        return JSONResponse(jobs)
    elif request.method == "POST":
        payload = await request.json()
        required = ["id", "title", "company"]
        for field in required:
            if not payload.get(field):
                return JSONResponse({"error": f"Field '{field}' is required"}, status_code=400)
        
        job = create_job(
            id=payload["id"],
            title=payload["title"],
            company=payload["company"],
            country=payload.get("country"),
            remote_allowed=payload.get("remote_allowed", False),
            employment_type=payload.get("employment_type", "internship"),
            duration_months=payload.get("duration_months"),
            compensation=payload.get("compensation"),
            description=payload.get("description"),
            application_url=payload.get("application_url"),
            closing_date=payload.get("closing_date"),
            skills=payload.get("skills", []),
        )
        return JSONResponse(job, status_code=201)


async def api_job_detail(request: Request) -> JSONResponse:
    job_id = request.path_params["job_id"]
    job = get_job(job_id)
    if not job:
        return JSONResponse({"error": f"Job '{job_id}' not found"}, status_code=404)
    return JSONResponse(job)


async def api_candidates(request: Request) -> JSONResponse:
    if request.method == "GET":
        candidates = list_candidates()
        return JSONResponse(candidates)
    elif request.method == "POST":
        payload = await request.json()
        candidate = upsert_candidate(
            candidate_id=payload["id"],
            full_name=payload["full_name"],
            country=payload["country"],
            city=payload.get("city"),
            email=payload.get("email"),
            availability_date=payload.get("availability_date"),
            languages=payload.get("languages"),
            education=payload.get("education"),
            summary=payload.get("summary"),
            skills=payload.get("skills", []),
        )
        return JSONResponse(candidate, status_code=201)


async def api_candidate_detail(request: Request) -> JSONResponse:
    candidate_id = request.path_params["candidate_id"]
    candidate = get_candidate(candidate_id)
    if not candidate:
        return JSONResponse({"error": f"Candidate '{candidate_id}' not found"}, status_code=404)
    return JSONResponse(candidate)


async def api_match(request: Request) -> JSONResponse:
    payload = await request.json()
    candidate_id = payload.get("candidate_id")
    job_id = payload.get("job_id")
    if not candidate_id or not job_id:
        return JSONResponse({"error": "candidate_id and job_id are required"}, status_code=400)

    try:
        result = match_candidate_to_job(candidate_id=candidate_id, job_id=job_id)
        return JSONResponse(result)
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=400)


async def api_applications(request: Request) -> JSONResponse:
    if request.method == "GET":
        candidate_id = request.query_params.get("candidate_id")
        apps = list_applications(candidate_id=candidate_id)
        return JSONResponse(apps)
    elif request.method == "POST":
        payload = await request.json()
        candidate_id = payload.get("candidate_id")
        job_id = payload.get("job_id")
        status = payload.get("status", "saved")
        try:
            app = create_application(candidate_id=candidate_id, job_id=job_id, status=status)
            return JSONResponse(app, status_code=201)
        except ValueError as e:
            return JSONResponse({"error": str(e)}, status_code=400)


async def api_update_application(request: Request) -> JSONResponse:
    app_id = request.path_params["application_id"]
    payload = await request.json()
    status = payload.get("status", "applied")
    notes = payload.get("notes")
    try:
        updated = update_application_status(application_id=app_id, status=status, notes=notes)
        return JSONResponse(updated)
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=400)


async def api_cover_letter(request: Request) -> JSONResponse:
    payload = await request.json()
    candidate_id = payload.get("candidate_id")
    job_id = payload.get("job_id")
    tone = payload.get("tone", "professional")
    try:
        result = generate_cover_letter(candidate_id=candidate_id, job_id=job_id, tone=tone)
        return JSONResponse(result)
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=400)


async def api_interview_questions(request: Request) -> JSONResponse:
    payload = await request.json()
    candidate_id = payload.get("candidate_id")
    job_id = payload.get("job_id")
    number = payload.get("number", 6)
    try:
        questions = generate_interview_questions(candidate_id=candidate_id, job_id=job_id, number=number)
        return JSONResponse(questions)
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=400)


async def api_interview_checklist(request: Request) -> JSONResponse:
    payload = await request.json()
    candidate_id = payload.get("candidate_id")
    job_id = payload.get("job_id")
    try:
        checklist = get_application_checklist(candidate_id=candidate_id, job_id=job_id)
        return JSONResponse(checklist)
    except ValueError as e:
        return JSONResponse({"error": str(e)}, status_code=400)


async def api_copilot_chat(request: Request) -> JSONResponse:
    """Intelligent assistant endpoint answering user queries using local services."""
    payload = await request.json()
    message = (payload.get("message") or "").lower().strip()
    candidate_id = payload.get("candidate_id", "DAMA-001")

    if not message:
        return JSONResponse({"reply": "Bonjour ! Posez-moi une question sur les offres tech, votre matching ou vos entretiens."})

    # 1. Search jobs query
    if any(w in message for w in ["job", "offre", "stage", "emploi", "poste", "trouve", "cherche"]):
        remote = "remote" in message or "télétravail" in message
        keywords = []
        for kw in ["python", "rag", "fastapi", "sql", "docker", "langgraph"]:
            if kw in message:
                keywords.append(kw)
        jobs = search_jobs(keywords=keywords or None, remote_only=remote)
        if jobs:
            res_list = [f"• **{j['title']}** chez {j['company']} ({j['country'] or 'Remote'})" for j in jobs[:4]]
            return JSONResponse({
                "reply": f"Voici les opportunités identifiées ({len(jobs)} trouvées) :\n\n" + "\n".join(res_list) + "\n\nVous pouvez cliquer sur **Offres Tech** ou **Matching IA** pour analyser votre profil."
            })
        else:
            return JSONResponse({"reply": "Aucune offre ne correspond exactement à ces critères. Essayez avec un mot-clé plus large comme 'Python'."})

    # 2. Matching query
    if any(w in message for w in ["match", "score", "compatibilité", "profil"]):
        jobs = search_jobs()
        if jobs:
            target_job = jobs[0]
            m = match_candidate_to_job(candidate_id, target_job["id"])
            return JSONResponse({
                "reply": f"📊 Votre score de matching avec **{target_job['title']} chez {target_job['company']}** est de **{m['match_score']}%**.\n\n"
                         f"✅ **Compétences en commun :** {', '.join(m['matching_skills']) or 'Aucune'}\n"
                         f"⚠️ **Lacunes :** {', '.join(m['missing_skills']) or 'Toutes validées !'}\n"
                         f"💡 **Conseil :** {m['recommendations'][0] if m['recommendations'] else ''}"
            })

    # 3. Interview query
    if any(w in message for w in ["entretien", "question", "interview", "checklist"]):
        jobs = search_jobs()
        if jobs:
            target_job = jobs[0]
            questions = generate_interview_questions(candidate_id, target_job["id"], number=3)
            q_formatted = "\n".join(f"{i+1}. {q}" for i, q in enumerate(questions))
            return JSONResponse({
                "reply": f"🎙️ Voici 3 questions clés pour l'offre **{target_job['title']} chez {target_job['company']}** :\n\n{q_formatted}\n\nRetrouvez la checklist complète dans l'onglet **Studio d'Entretien** !"
            })

    # Default assistance
    return JSONResponse({
        "reply": "Je suis **JobPilot Copilot**, votre assistant carrière tech en Afrique. Vous pouvez me demander :\n\n"
                 "• *'Trouve-moi des stages en télétravail'* \n"
                 "• *'Quel est mon matching avec les offres d'IA ?'* \n"
                 "• *'Prépare mes questions d'entretien'*"
    })


routes = [
    Route("/", endpoint=index, methods=["GET"]),
    Route("/api/jobs", endpoint=api_jobs, methods=["GET", "POST"]),
    Route("/api/jobs/{job_id}", endpoint=api_job_detail, methods=["GET"]),
    Route("/api/candidates", endpoint=api_candidates, methods=["GET", "POST"]),
    Route("/api/candidates/{candidate_id}", endpoint=api_candidate_detail, methods=["GET"]),
    Route("/api/match", endpoint=api_match, methods=["POST"]),
    Route("/api/applications", endpoint=api_applications, methods=["GET", "POST"]),
    Route("/api/applications/{application_id}", endpoint=api_update_application, methods=["PATCH"]),
    Route("/api/applications/cover-letter", endpoint=api_cover_letter, methods=["POST"]),
    Route("/api/interview/questions", endpoint=api_interview_questions, methods=["POST"]),
    Route("/api/interview/checklist", endpoint=api_interview_checklist, methods=["POST"]),
    Route("/api/copilot/chat", endpoint=api_copilot_chat, methods=["POST"]),
    Mount("/static", app=StaticFiles(directory=str(STATIC_DIR)), name="static"),
]

app = Starlette(routes=routes)


def run_web_server(host: str = "127.0.0.1", port: int = 8000) -> None:
    """Launch the Web Dashboard server."""
    import uvicorn
    init_db()
    seed_demo_data()
    print(f"🚀 JobPilot Africa Dashboard disponible sur : http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    run_web_server()
