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
from jobpilot.services.application_service import create_application, list_applications, update_application_status
from jobpilot.services.candidate_service import get_candidate, list_candidates, upsert_candidate
from jobpilot.services.interview_service import generate_interview_questions, get_application_checklist
from jobpilot.services.job_service import get_job, search_jobs

STATIC_DIR = Path(__file__).resolve().parent / "static"


async def index(request: Request) -> Response:
    """Serve the single page application HTML."""
    html_file = STATIC_DIR / "index.html"
    return HTMLResponse(html_file.read_text(encoding="utf-8"))


async def api_jobs(request: Request) -> JSONResponse:
    country = request.query_params.get("country")
    if country == "all":
        country = None
    remote_only = request.query_params.get("remote_only") == "true"
    keywords_param = request.query_params.get("keywords")
    keywords = [k.strip() for k in keywords_param.split(",") if k.strip()] if keywords_param else None

    jobs = search_jobs(keywords=keywords, country=country, remote_only=remote_only)
    return JSONResponse(jobs)


async def api_job_detail(request: Request) -> JSONResponse:
    job_id = request.path_params["job_id"]
    job = get_job(job_id)
    if not job:
        return JSONResponse({"error": f"Job '{job_id}' not found"}, status_code=404)
    return JSONResponse(job)


async def api_candidates(request: Request) -> JSONResponse:
    candidates = list_candidates()
    return JSONResponse(candidates)


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
        from jobpilot.services.matching_service import match_candidate_to_job
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


routes = [
    Route("/", endpoint=index, methods=["GET"]),
    Route("/api/jobs", endpoint=api_jobs, methods=["GET"]),
    Route("/api/jobs/{job_id}", endpoint=api_job_detail, methods=["GET"]),
    Route("/api/candidates", endpoint=api_candidates, methods=["GET"]),
    Route("/api/candidates/{candidate_id}", endpoint=api_candidate_detail, methods=["GET"]),
    Route("/api/match", endpoint=api_match, methods=["POST"]),
    Route("/api/applications", endpoint=api_applications, methods=["GET", "POST"]),
    Route("/api/applications/{application_id}", endpoint=api_update_application, methods=["PATCH"]),
    Route("/api/interview/questions", endpoint=api_interview_questions, methods=["POST"]),
    Route("/api/interview/checklist", endpoint=api_interview_checklist, methods=["POST"]),
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
