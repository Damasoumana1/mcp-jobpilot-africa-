import io
import zipfile

import pytest
from starlette.testclient import TestClient

from jobpilot.services.application_pack_service import FILE_NAMES
from jobpilot.services.candidate_service import get_candidate
from jobpilot.services.application_service import list_applications
from jobpilot.web import app

client = TestClient(app)


@pytest.mark.parametrize('language', ['fr', 'en'])
def test_preview_and_download_exact_edited_files_without_side_effects(language):
    before = get_candidate('DAMA-001')
    before_apps = list_applications('DAMA-001')
    preview = client.post('/api/applications/pack', json={'candidate_id': 'DAMA-001', 'job_id': 'JOB-001', 'language': language})
    assert preview.status_code == 200
    pack = preview.json()
    assert pack['candidate_name'] == before['full_name']
    assert [file['name'] for file in pack['files']] == FILE_NAMES[language]
    assert 'AfrikaLabs' in pack['files'][0]['content']
    assert ('Madame' if language == 'fr' else 'Dear') in pack['files'][0]['content']
    assert ('Vérifier' if language == 'fr' else 'Check') in pack['files'][2]['content']
    assert 'recently applied' not in pack['files'][1]['content']
    assert 'viens de postuler' not in pack['files'][1]['content']
    pack['files'][0]['content'] += '\nCorrection personnelle — café, compétences.'
    # Download uses the exact reviewed snapshot, not a regenerated letter.
    response = client.post('/api/applications/pack/download', json={'language': language, 'files': pack['files']})
    assert response.status_code == 200
    assert response.headers['content-type'] == 'application/zip'
    assert response.headers['cache-control'] == 'no-store'
    with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
        assert set(archive.namelist()) == set(FILE_NAMES[language])
        for file in pack['files']:
            assert archive.read(file['name']).decode('utf-8') == file['content']
    assert get_candidate('DAMA-001') == before
    assert list_applications('DAMA-001') == before_apps


@pytest.mark.parametrize('changes', [{'candidate_id':'UNKNOWN'}, {'job_id':'UNKNOWN'}, {'language':'xx'}])
def test_invalid_pack_context(changes):
    response = client.post('/api/applications/pack', json={'candidate_id':'DAMA-001','job_id':'JOB-001', **changes})
    assert response.status_code == (400 if 'language' in changes else 404)


@pytest.mark.parametrize('name', ['../secret.txt', '/etc/file', 'C:\\file.txt', 'checklist.txt'])
def test_download_rejects_unsafe_or_duplicate_names(name):
    files = [{'name':item, 'content':'text'} for item in FILE_NAMES['fr']]
    files[0]['name'] = name
    assert client.post('/api/applications/pack/download', json={'language':'fr', 'files':files}).status_code == 400


def test_pack_uses_selected_profile():
    client.post('/api/candidates', json={'id':'PACK-OTHER','full_name':'Awa Export','country':'Mali','skills':['React']})
    response = client.post('/api/applications/pack', json={'candidate_id':'PACK-OTHER','job_id':'JOB-001','language':'en'})
    assert response.status_code == 200
    assert response.json()['candidate_name'] == 'Awa Export'
    assert 'Awa Export' in response.json()['files'][0]['content']
    assert list_applications('PACK-OTHER') == []


def test_mcp_pack_preview():
    from jobpilot.tools.application_tools import prepare_application_pack_tool
    assert len(prepare_application_pack_tool('DAMA-001', 'JOB-001')['files']) == 4
