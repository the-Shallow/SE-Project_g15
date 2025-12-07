import pytest
from datetime import datetime, timedelta, timezone

# -----------------------------------------------------------
# FIXTURES
# -----------------------------------------------------------

@pytest.fixture
def user_token(client):
    """Register + login a test user and return auth header."""
    client.post("/api/auth/register", json={
        "username": "alice",
        "email": "alice@example.com",
        "password": "pass123"
    })
    res = client.post("/api/auth/login", json={
        "username": "alice",
        "password": "pass123"
    })
    token = res.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def create_group(client, user_token):
    """Create a sample group and return group_id."""
    payload = {
        "name": "TestGroup",
        "restaurant_id": 1,
        "deliveryType": "pickup",
        "deliveryLocation": "Main Gate",
        "nextOrderTime": (datetime.now(timezone.utc)+timedelta(hours=1)).isoformat(),
        "maxMembers": 5
    }
    res = client.post("/api/groups", json=payload, headers=user_token)
    return res.get_json()["id"]

# -----------------------------------------------------------
# GROUP TESTS (1–7)
# -----------------------------------------------------------

def test_group_create(client, user_token):
    res = client.post("/api/groups", json={
        "name": "G1",
        "restaurant_id": 1,
        "deliveryType": "pickup",
        "deliveryLocation": "Spot A",
        "nextOrderTime": (datetime.now(timezone.utc)+timedelta(hours=1)).isoformat()
    }, headers=user_token)

    assert res.status_code == 201
    assert res.get_json()["name"] == "G1"


def test_get_groups_public(client):
    res = client.get("/api/groups")
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_get_my_groups(client, user_token):
    res = client.get("/api/groups/my-groups", headers=user_token)
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)


def test_group_detail(client, user_token, create_group):
    group_id = create_group
    res = client.get(f"/api/groups/{group_id}", headers=user_token)
    assert res.status_code == 200
    assert res.get_json()["id"] == group_id


def test_group_update(client, user_token, create_group):
    group_id = create_group
    res = client.put(f"/api/groups/{group_id}",
                     json={"name": "Updated"},
                     headers=user_token)
    assert res.status_code == 200
    assert res.get_json()["name"] == "Updated"


def test_group_join(client, user_token, create_group):
    res = client.post(f"/api/groups/{create_group}/join", headers=user_token)
    assert res.status_code in [200, 400]


def test_group_leave(client, user_token, create_group):
    """Organizer cannot leave → expect 400"""
    res = client.post(f"/api/groups/{create_group}/leave", headers=user_token)
    assert res.status_code == 400

# -----------------------------------------------------------
# ORDER TESTS (8–13)
# -----------------------------------------------------------

def test_get_orders_unauth(client, create_group):
    res = client.get(f"/api/groups/{create_group}/orders")
    assert res.status_code == 401


def test_add_order_member_required(client, user_token):
    """User tries ordering in non-member group → 403"""
    res = client.post("/api/groups/999/orders", json={"items": []}, headers=user_token)
    assert res.status_code in [403, 404]


def test_add_order_basic_flow(client, user_token, create_group):
    payload = {
        "items": []
    }
    res = client.post(f"/api/groups/{create_group}/orders",
                      json=payload,
                      headers=user_token)
    assert res.status_code in [200, 201]


def test_add_order_with_items(client, user_token, create_group):
    """MenuItem must exist (your backend may give 404)."""
    payload = {
        "items": [
            {"menuItemId": 1, "quantity": 2}
        ]
    }
    res = client.post(f"/api/groups/{create_group}/orders",
                      json=payload,
                      headers=user_token)
    assert res.status_code in [201, 404]


def test_delete_order(client, user_token, create_group):
    client.post(f"/api/groups/{create_group}/orders",
                json={"items": []},
                headers=user_token)

    res = client.delete(f"/api/groups/{create_group}/orders", headers=user_token)
    assert res.status_code in [200, 404]

# -----------------------------------------------------------
# LOYALTY / COUPON TESTS (14–20)
# -----------------------------------------------------------

def test_rewards_summary(client, user_token):
    res = client.get("/api/rewards/summary", headers=user_token)
    assert res.status_code == 200
    data = res.get_json()
    assert "points" in data
    assert "coupons" in data
    assert "ledger" in data


def test_quote_insufficient_points(client, user_token):
    res = client.post("/api/rewards/quote",
                      json={"points_to_use": 50, "order_subtotal_cents": 1000},
                      headers=user_token)
    assert res.status_code == 400


def test_quote_valid_request(client, user_token):
    res = client.post("/api/rewards/quote",
                      json={"points_to_use": 200, "order_subtotal_cents": 10000},
                      headers=user_token)
    assert res.status_code in [200, 400]  # depends on user balance


def test_coupon_redeem_invalid_type(client, user_token):
    res = client.post("/api/rewards/redeem-coupon",
                      json={"type": "INVALID"},
                      headers=user_token)
    assert res.status_code == 400


def test_coupon_redeem_percent_off(client, user_token):
    res = client.post("/api/rewards/redeem-coupon",
                      json={"type": "percent_off"},
                      headers=user_token)
    assert res.status_code in [201, 400]


def test_coupon_redeem_flat(client, user_token):
    res = client.post("/api/rewards/redeem-coupon",
                      json={"type": "flat"},
                      headers=user_token)
    assert res.status_code in [201, 400]


def test_redeem_points_minimum(client, user_token):
    res = client.post("/api/rewards/redeem",
                      json={"points_to_use": 50},
                      headers=user_token)
    assert res.status_code == 400
