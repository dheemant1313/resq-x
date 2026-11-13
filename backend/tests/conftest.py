import os
import pytest

# Ensure test suite runs with fast SQLite test database without attempting network connections
os.environ["DATABASE_URL"] = "sqlite:///./test_resqx.db"
os.environ["USE_SQLITE_FALLBACK"] = "True"

from app.core.database import engine, Base
from app.main import app

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_resqx.db"):
        try:
            os.remove("./test_resqx.db")
        except Exception:
            pass
