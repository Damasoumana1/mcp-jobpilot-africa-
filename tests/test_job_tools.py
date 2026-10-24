from jobpilot.services.job_service import search_jobs


def test_search_jobs_returns_results():
    results = search_jobs(keywords=["Python", "RAG"], country="Burkina Faso", remote_only=True)
    assert isinstance(results, list)
    assert len(results) >= 1
