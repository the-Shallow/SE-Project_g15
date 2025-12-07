import pytest
from datetime import datetime, timedelta, timezone
from app import create_app
from extensions import db
from models import Group, GroupOrder, GroupOrderItem, GroupMember

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def app():
    app = create_app({"TESTING": True})
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

def test_get_group_orders_unauthorized(client):
    res = client.get("/groups/1/orders")
    assert res.status_code == 401

def test_add_order_member_not_found(client, app, mocker):
    mocker.patch("flask_jwt_extended.view_decorators.verify_jwt_in_request", return_value=True)
    mocker.patch("flask_jwt_extended.get_jwt", return_value={"username": "bob"})
    mocker.patch("backend.routes.orders.GroupMember.query.filter_by", return_value=mocker.Mock(first=lambda: None))
    res = client.post("/groups/1/orders", json={"items": []})
    assert res.status_code == 403

def test_parse_iso_utc_converts():
    from backend.routes import orders
    dt = orders.parse_iso_utc("2025-01-01T12:00:00Z")
    assert dt.tzinfo == timezone.utc
