from __future__ import annotations

import pytest

from jobpilot.database.connection import init_db
from jobpilot.database.seed import seed_demo_data


@pytest.fixture(autouse=True)
def setup_test_db(tmp_path, monkeypatch):
    """Fixture initializing an isolated test database for every test."""
    test_db = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_PATH", str(test_db))
    init_db()
    seed_demo_data()
    yield test_db
