# backend/tests/conftest.py
import pytest
from app import create_app
from extensions import db


@pytest.fixture()
def client():
    app = create_app()
    app.config["TESTING"] = True
    app.config["JWT_SECRET_KEY"] = "test-secret-key-for-testing"
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        "sqlite:///:memory:"  # in-memory DB for tests
    )

    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()
