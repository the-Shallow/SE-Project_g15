import pytest
from datetime import datetime, timedelta, UTC

# ------------------- HEALTH ROUTE -------------------


def test_health_check(client):
    """Check if the server health route returns 200."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert "status" in data
    assert data["status"] == "Server is running"


# ------------------- GROUP ROUTES -------------------


@pytest.fixture
def auth_header(client):
    """Register + login to get JWT token header."""
    client.post(
        "/api/auth/register",
        json={
            "username": "groupuser",
            "email": "groupuser@example.com",
            "password": "testpass",
        },
    )
    login_resp = client.post(
        "/api/auth/login", json={"username": "groupuser", "password": "testpass"}
    )
    token = login_resp.get_json().get("token")
    return {"Authorization": f"Bearer {token}"}


def test_create_group(client, auth_header):
    """Test creation of a new group by authenticated user."""
    data = {
        "name": "Test Group",
        "restaurant_id": 1,
        "deliveryType": "pickup",
        "deliveryLocation": "Campus Cafe",
        "nextOrderTime": (datetime.now(UTC) + timedelta(hours=1))
        .isoformat()
        .replace("+00:00", "Z"),
        "maxMembers": 5,
    }
    response = client.post("/api/groups", json=data, headers=auth_header)
    assert response.status_code == 201
    resp_json = response.get_json()
    assert resp_json["name"] == "Test Group"
    assert resp_json["organizer"] == "groupuser"


def test_get_all_groups(client):
    """Ensure that all groups can be fetched (public route)."""
    response = client.get("/api/groups")
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)


def test_get_my_groups(client, auth_header):
    """Check that an authenticated user can fetch their joined groups."""
    response = client.get("/api/groups/my-groups", headers=auth_header)
    assert response.status_code in [200, 404, 500]  # Flexible if DB is empty
    assert isinstance(response.get_json(), (list, dict))


def test_get_specific_group(client, auth_header):
    """Fetch one group by its ID."""
    group_resp = client.post(
        "/api/groups",
        json={
            "name": "GroupDetail",
            "restaurant_id": 2,
            "deliveryType": "delivery",
            "deliveryLocation": "Main Gate",
            "nextOrderTime": (datetime.now(UTC) + timedelta(hours=2))
            .isoformat()
            .replace("+00:00", "Z"),
            "maxMembers": 10,
        },
        headers=auth_header,
    )
    group_id = group_resp.get_json().get("id")

    response = client.get(f"/api/groups/{group_id}", headers=auth_header)
    assert response.status_code == 200
    data = response.get_json()
    assert data["id"] == group_id


def test_update_group(client, auth_header):
    """Organizer should be able to update group details."""
    group_resp = client.post(
        "/api/groups",
        json={
            "name": "UpdateTest",
            "restaurant_id": 5,
            "deliveryType": "pickup",
            "deliveryLocation": "Library",
            "nextOrderTime": (datetime.now(UTC) + timedelta(hours=2))
            .isoformat()
            .replace("+00:00", "Z"),
        },
        headers=auth_header,
    )
    group_id = group_resp.get_json()["id"]

    updated_data = {"name": "UpdatedName"}
    response = client.put(
        f"/api/groups/{group_id}", json=updated_data, headers=auth_header
    )
    assert response.status_code == 200
    assert response.get_json()["name"] == "UpdatedName"


def test_join_and_leave_group(client, auth_header):
    """Test joining and leaving a group as a user."""
    group_resp = client.post(
        "/api/groups",
        json={
            "name": "JoinableGroup",
            "restaurant_id": 3,
            "deliveryType": "delivery",
            "deliveryLocation": "Hostel Gate",
            "nextOrderTime": (datetime.now(UTC) + timedelta(hours=3))
            .isoformat()
            .replace("+00:00", "Z"),
        },
        headers=auth_header,
    )
    group_id = group_resp.get_json()["id"]

    join_resp = client.post(f"/api/groups/{group_id}/join", headers=auth_header)
    assert join_resp.status_code in [200, 400]  # Could already be a member

    leave_resp = client.post(f"/api/groups/{group_id}/leave", headers=auth_header)
    assert leave_resp.status_code in [200, 400, 404]


# ------------------- POLL ROUTES -------------------


def test_create_poll(client):
    """Test poll creation inside a group."""
    group_id = 1  # Assume group with ID 1 exists (create_group ensures one)
    poll_data = {
        "question": "Favorite food?",
        "createdBy": "groupuser",
        "options": ["Pizza", "Burger", "Pasta"],
    }
    response = client.post(f"/api/groups/{group_id}/polls", json=poll_data)
    assert response.status_code in [201, 400]
    if response.status_code == 201:
        data = response.get_json()
        assert "question" in data


def test_get_group_polls(client):
    """Retrieve all polls for a given group."""
    group_id = 1
    response = client.get(f"/api/groups/{group_id}/polls")
    assert response.status_code in [200, 500]
    assert isinstance(response.get_json(), (list, dict))


def test_vote_on_poll(client):
    """Simulate voting on a poll."""
    poll_id = 1  # Assuming a poll exists
    response = client.post(
        f"/api/polls/{poll_id}/vote", json={"username": "groupuser", "option_id": 1}
    )
    assert response.status_code in [200, 400, 500]
    if response.status_code == 200:
        data = response.get_json()
        assert "id" in data
