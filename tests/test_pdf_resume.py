import io
import subprocess

import pytest
from pypdf import PdfWriter
from pypdf.generic import DictionaryObject, NameObject, DecodedStreamObject
from starlette.testclient import TestClient

from jobpilot.services.pdf_service import extract_pdf_text, extract_pdf_isolated, PdfExtractionError, MAX_PDF_BYTES
from jobpilot.services.candidate_service import get_candidate
from jobpilot.web import app


def make_pdf(text="Awa Test", pages=1, encrypted=False):
    writer = PdfWriter()
    for index in range(pages):
        page = writer.add_blank_page(width=595, height=842)
        if text and index == 0:
            font = DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'), NameObject('/BaseFont'): NameObject('/Helvetica')})
            page[NameObject('/Resources')] = DictionaryObject({NameObject('/Font'): DictionaryObject({NameObject('/F1'): writer._add_object(font)})})
            stream = DecodedStreamObject()
            escaped = text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
            stream.set_data(f"BT /F1 12 Tf 40 780 Td ({escaped}) Tj ET".encode('latin-1'))
            page[NameObject('/Contents')] = writer._add_object(stream)
    if encrypted:
        writer.encrypt('secret')
    output = io.BytesIO()
    writer.write(output)
    return output.getvalue()


def test_pdf_preview_analysis_then_explicit_save():
    client = TestClient(app)
    before = get_candidate('DAMA-001')
    pdf = make_pdf('Awa Test\nawa@example.org\nSenegal\nPython SQL React\n3 years of experience')
    result = client.post('/api/candidates/extract-resume-pdf', content=pdf, headers={'Content-Type': 'application/pdf'})
    assert result.status_code == 200
    text = result.json()['resume_text']
    assert 'Python' in text
    assert result.json()['page_count'] == 1
    assert get_candidate('DAMA-001') == before
    preview = client.post('/api/candidates/parse-resume', json={'resume_text': text, 'candidate_id': 'DAMA-001', 'auto_save': False})
    assert preview.status_code == 200
    assert 'Python' in preview.json()['skills']
    assert get_candidate('DAMA-001') == before
    saved = client.post('/api/candidates/parse-resume', json={'resume_text': text, 'candidate_id': 'DAMA-001', 'auto_save': True})
    assert saved.status_code == 200
    assert get_candidate('DAMA-001')['email'] == 'awa@example.org'


@pytest.mark.parametrize('pdf,code', [
    (b'not a PDF', 'invalid_pdf'), (b'%PDF-1.7 broken', 'invalid_pdf'),
    (make_pdf(text=''), 'no_pdf_text'), (make_pdf(encrypted=True), 'encrypted_pdf'),
    (make_pdf(pages=11), 'too_many_pages'),
])
def test_pdf_rejects_unreadable_documents_without_updating_profiles(pdf, code):
    before = get_candidate('DAMA-001')
    response = TestClient(app).post('/api/candidates/extract-resume-pdf', content=pdf, headers={'Content-Type': 'application/pdf'})
    assert response.status_code == 422
    assert response.json()['error'] == code
    assert get_candidate('DAMA-001') == before


def test_mixed_pdf_warns_about_pages_without_text():
    result = extract_pdf_text(make_pdf(pages=2))
    assert result['empty_pages'] == [2]
    assert result['page_count'] == 2


def test_upload_limits_and_content_type():
    client = TestClient(app)
    assert client.post('/api/candidates/extract-resume-pdf', content=b'text').status_code == 415
    response = client.post('/api/candidates/extract-resume-pdf', content=b'%PDF-' + b' ' * MAX_PDF_BYTES, headers={'Content-Type': 'application/pdf'})
    assert response.status_code == 413


def test_pdf_worker_timeout(monkeypatch):
    def timeout(*args, **kwargs):
        raise subprocess.TimeoutExpired('worker', 20)
    monkeypatch.setattr(subprocess, 'run', timeout)
    with pytest.raises(PdfExtractionError, match='pdf_timeout'):
        extract_pdf_isolated(make_pdf())
