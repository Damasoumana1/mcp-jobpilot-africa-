import pytest
from starlette.testclient import TestClient

from jobpilot.geography import COUNTRIES, REGIONS, country_key, detect_country
from jobpilot.services.job_service import create_job, search_jobs
from jobpilot.services.candidate_service import upsert_candidate
from jobpilot.services.matching_service import match_candidate_to_job
from jobpilot.services.resume_service import extract_contact_info
from jobpilot.tools.job_tools import get_geography_tool, search_jobs_tool
from jobpilot.web import app


def test_complete_unique_registry_and_api():
    assert len(COUNTRIES) == 55
    assert len({c["code"] for c in COUNTRIES}) == 55
    assert {c["region"] for c in COUNTRIES} == {r["id"] for r in REGIONS}
    response = TestClient(app).get("/api/geography")
    assert response.status_code == 200
    assert response.json() == get_geography_tool()


@pytest.mark.parametrize("country", COUNTRIES, ids=lambda c: c["code"])
def test_all_countries_are_searchable_and_detectable(country):
    create_job(id="GEO-JOB", title="Developer", company="Test", country=country["en"])
    for alias in [country["code"], country["fr"], country["en"], *country["aliases"]]:
        assert country_key(alias) == country["code"]
        assert any(j["id"] == "GEO-JOB" for j in search_jobs(country=alias))
    assert detect_country(f"Location: {country['en']}") == country["fr"]
    assert extract_contact_info(f"Location: {country['en']}")["country"] == country["fr"]
    assert any(j["id"] == "GEO-JOB" for j in search_jobs(region=country["region"]))


def test_similar_names_do_not_overlap():
    for name, expected in [("South Sudan", "SS"), ("Sudan", "SD"), ("Nigeria", "NG"),
                           ("Niger", "NE"), ("Equatorial Guinea", "GQ"), ("Guinea-Bissau", "GW"),
                           ("DR Congo", "CD"), ("Congo", "CG")]:
        assert country_key(detect_country(name)) == expected
    create_job(id="NIGER", title="Developer", company="Test", country="Niger")
    assert not any(j["id"] == "NIGER" for j in search_jobs(country="Nigeria"))


def test_matching_uses_country_identity():
    upsert_candidate("GEO-CAND", "Candidate", "Éthiopie", skills=["Python"])
    create_job(id="GEO-JOB", title="Developer", company="Test", country="Ethiopia", skills=["Python"])
    result = match_candidate_to_job("GEO-CAND", "GEO-JOB")
    assert result["relocation_needed"] is False
    create_job(id="NO-SKILLS", title="General role", company="Test", country="Zambia")
    assert match_candidate_to_job("GEO-CAND", "NO-SKILLS")["relocation_needed"] is True


def test_region_api_and_mcp():
    client = TestClient(app)
    assert client.get("/api/jobs?region=invalid").status_code == 400
    with pytest.raises(ValueError, match="Unknown region"):
        search_jobs_tool(region="invalid")
    create_job(id="GEO-ER", title="Developer", company="Test", country="Eritrea")
    assert any(j["id"] == "GEO-ER" for j in client.get("/api/jobs?country=Érythrée&region=east").json())
