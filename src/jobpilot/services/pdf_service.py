"""Extract PDF text without storing the original file or updating a profile."""
from __future__ import annotations

import io
import json
import subprocess
import sys

from pypdf import PdfReader

MAX_PDF_BYTES = 5 * 1024 * 1024
MAX_PDF_PAGES = 10
MAX_RESUME_TEXT = 100_000


class PdfExtractionError(ValueError):
    def __init__(self, code: str):
        self.code = code
        super().__init__(code)


def extract_pdf_text(data: bytes) -> dict:
    if len(data) > MAX_PDF_BYTES:
        raise PdfExtractionError("pdf_too_large")
    if not data.startswith(b"%PDF-"):
        raise PdfExtractionError("invalid_pdf")
    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            raise PdfExtractionError("encrypted_pdf")
        count = len(reader.pages)
        if count > MAX_PDF_PAGES:
            raise PdfExtractionError("too_many_pages")
        parts = []
        empty_pages = []
        length = 0
        for number, page in enumerate(reader.pages, 1):
            text = (page.extract_text() or "").strip()
            length += len(text) + 2
            if length > MAX_RESUME_TEXT:
                raise PdfExtractionError("too_much_text")
            if not text:
                empty_pages.append(number)
            parts.append(text)
        result = "\n\n".join(parts).strip()
        if not result:
            raise PdfExtractionError("no_pdf_text")
        return {"resume_text": result, "page_count": count, "empty_pages": empty_pages}
    except PdfExtractionError:
        raise
    except Exception as exc:
        raise PdfExtractionError("invalid_pdf") from exc


def extract_pdf_isolated(data: bytes) -> dict:
    """Bound PDF processing time independently of the web server event loop."""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "jobpilot.services.pdf_service"], input=data,
            capture_output=True, timeout=20, check=False,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        payload = json.loads(result.stdout)
        if result.returncode or "error" in payload:
            raise PdfExtractionError(payload.get("error", "invalid_pdf"))
        return payload
    except subprocess.TimeoutExpired as exc:
        raise PdfExtractionError("pdf_timeout") from exc
    except (OSError, ValueError) as exc:
        if isinstance(exc, PdfExtractionError):
            raise
        raise PdfExtractionError("invalid_pdf") from exc


if __name__ == "__main__":
    try:
        output = extract_pdf_text(sys.stdin.buffer.read(MAX_PDF_BYTES + 1))
    except PdfExtractionError as exc:
        output = {"error": exc.code}
    sys.stdout.buffer.write(json.dumps(output, ensure_ascii=False).encode("utf-8"))
