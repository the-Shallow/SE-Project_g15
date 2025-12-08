"""
Discovery Test Suite
--------------------
Tests for proximity-based pool discovery features:
✅ Nearby pools discovery with GPS filtering
✅ User location updates
✅ Distance calculations and radius filtering
✅ Privacy and visibility controls
✅ Restaurant-specific filtering
✅ Membership status checking
"""

import pytest
from datetime import datetime, timedelta, timezone
from models import Group, User, GroupMember, Restaurant
from extensions import db


# -----------------------------------------------------------
# FIXTURES
# -----------------------------------------------------------

@pytest.fixture(autouse=True)
def seed_restaurant(client):
    """Ensure test restaurant exists."""
    with client.application.app_context():
        if not Restaurant.query.get(1):
            db.session.add(Restaurant(
                id=1,
                name="Test Pizza",
                rating=4.5,
                location="Campus",
                offers="None",
                image="🍕",
                reward_multiplier=1.0
            ))
            db.session.commit()


@pytest.fixture
def auth_user(client):
    """Register and login a user, return token and username."""
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
    return {
        "header": {"Authorization": f"Bearer {token}"},
        "username": "alice"
    }


@pytest.fixture
def other_user(client):
    """Create a second user for multi-user scenarios."""
    client.post("/api/auth/register", json={
        "username": "bob",
        "email": "bob@example.com",
        "password": "pass123"
    })
    res = client.post("/api/auth/login", json={
        "username": "bob",
        "password": "pass123"
    })
    token = res.get_json()["token"]
    return {
        "header": {"Authorization": f"Bearer {token}"},
        "username": "bob"
    }


@pytest.fixture
def set_user_location(client, auth_user):
    """Set alice's location to NC State campus coordinates."""
    # NC State Bell Tower: 35.7868, -78.6647
    res = client.put("/api/discovery/update-location",
                     json={"latitude": 35.7868, "longitude": -78.6647},
                     headers=auth_user["header"])
    assert res.status_code == 200
    return {"lat": 35.7868, "lng": -78.6647}


@pytest.fixture
def nearby_group(client, other_user, set_user_location):
    """Create a nearby group (~0.5km from alice)."""
    # Set bob's location nearby
    client.put("/api/discovery/update-location",
               json={"latitude": 35.7900, "longitude": -78.6680},
               headers=other_user["header"])
    
    # Create group with bob as organizer
    payload = {
        "name": "Nearby Pizza Pool",
        "restaurant_id": 1,
        "deliveryType": "delivery",
        "deliveryLocation": "Campus Cafe",
        "nextOrderTime": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
        "maxMembers": 5,
        "visibility": "public",
        "searchRadiusKm": 5.0
    }
    res = client.post("/api/groups", json=payload, headers=other_user["header"])
    return res.get_json()


@pytest.fixture
def far_group(client, other_user):
    """Create a far group (~10km from alice) - should not appear in nearby."""
    # Set bob to downtown Raleigh (far from NC State)
    client.put("/api/discovery/update-location",
               json={"latitude": 35.7796, "longitude": -78.6382},
               headers=other_user["header"])
    
    payload = {
        "name": "Downtown Pool",
        "restaurant_id": 1,
        "deliveryType": "delivery",
        "deliveryLocation": "Downtown",
        "nextOrderTime": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
        "maxMembers": 5,
        "visibility": "public"
    }
    res = client.post("/api/groups", json=payload, headers=other_user["header"])
    return res.get_json()


# -----------------------------------------------------------
# TEST CASES: Location Updates (1-5)
# -----------------------------------------------------------

def test_update_location_success(client, auth_user):
    """1️⃣ Should successfully update user's GPS location."""
    res = client.put("/api/discovery/update-location",
                     json={"latitude": 35.7868, "longitude": -78.6647},
                     headers=auth_user["header"])
    
    assert res.status_code == 200
    data = res.get_json()
    assert data["latitude"] == 35.7868
    assert data["longitude"] == -78.6647
    assert "message" in data


def test_update_location_unauthorized(client):
    """2️⃣ Should reject location update without authentication."""
    res = client.put("/api/discovery/update-location",
                     json={"latitude": 35.7868, "longitude": -78.6647})
    assert res.status_code == 401


def test_update_location_invalid_coordinates(client, auth_user):
    """3️⃣ Should handle invalid coordinate values gracefully."""
    res = client.put("/api/discovery/update-location",
                     json={"latitude": "invalid", "longitude": -78.6647},
                     headers=auth_user["header"])
    assert res.status_code in [400, 500]


def test_update_location_missing_fields(client, auth_user):
    """4️⃣ Should handle missing latitude/longitude."""
    res = client.put("/api/discovery/update-location",
                     json={"latitude": 35.7868},
                     headers=auth_user["header"])
    # Should accept partial updates or return error
    assert res.status_code in [200, 400]


def test_update_location_persistence(client, auth_user):
    """5️⃣ Location update should persist in database."""
    client.put("/api/discovery/update-location",
               json={"latitude": 35.7868, "longitude": -78.6647},
               headers=auth_user["header"])
    
    # Verify by checking user in database
    with client.application.app_context():
        user = User.query.filter_by(username="alice").first()
        assert user.latitude == 35.7868
        assert user.longitude == -78.6647
        assert user.location_updated_at is not None


# -----------------------------------------------------------
# TEST CASES: Nearby Pools Discovery (6-15)
# -----------------------------------------------------------

def test_get_nearby_pools_success(client, auth_user, set_user_location, nearby_group):
    """6️⃣ Should find pools within specified radius."""
    res = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=5",
                     headers=auth_user["header"])
    
    assert res.status_code == 200
    pools = res.get_json()
    assert isinstance(pools, list)
    assert len(pools) >= 1
    assert pools[0]["name"] == "Nearby Pizza Pool"


def test_nearby_pools_includes_distance(client, auth_user, set_user_location, nearby_group):
    """7️⃣ Response should include distance_km for each pool."""
    res = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=5",
                     headers=auth_user["header"])
    
    pools = res.get_json()
    assert len(pools) > 0
    assert "distance_km" in pools[0]
    assert isinstance(pools[0]["distance_km"], (int, float))


def test_nearby_pools_sorted_by_distance(client, auth_user, set_user_location, other_user):
    """8️⃣ Pools should be sorted by distance (closest first)."""
    # Create 3 groups at different distances
    locations = [
        (35.7900, -78.6680, "Close Pool"),
        (35.7950, -78.6700, "Medium Pool"),
        (35.8000, -78.6750, "Far Pool")
    ]
    
    for lat, lng, name in locations:
        client.put("/api/discovery/update-location",
                   json={"latitude": lat, "longitude": lng},
                   headers=other_user["header"])
        
        client.post("/api/groups", json={
            "name": name,
            "restaurant_id": 1,
            "deliveryType": "delivery",
            "deliveryLocation": "Location",
            "nextOrderTime": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
            "visibility": "public"
        }, headers=other_user["header"])
    
    res = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=10",
                     headers=auth_user["header"])
    
    pools = res.get_json()
    # Verify distances are in ascending order
    for i in range(len(pools) - 1):
        assert pools[i]["distance_km"] <= pools[i+1]["distance_km"]


def test_nearby_pools_respects_radius(client, auth_user, set_user_location, nearby_group, far_group):
    """9️⃣ Should only return pools within specified radius."""
    res = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=2",
                     headers=auth_user["header"])
    
    pools = res.get_json()
    # All returned pools should be within 2km
    for pool in pools:
        assert pool["distance_km"] <= 2.0


def test_nearby_pools_missing_coordinates(client, auth_user):
    """🔟 Should return error when lat/lon missing."""
    res = client.get("/api/discovery/nearby-pools?radius=5",
                     headers=auth_user["header"])
    assert res.status_code == 400
    assert "error" in res.get_json()


def test_nearby_pools_default_radius(client, auth_user, set_user_location, nearby_group):
    """1️⃣1️⃣ Should use default radius (5km) when not specified."""
    res = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647",
                     headers=auth_user["header"])
    
    assert res.status_code == 200
    pools = res.get_json()
    # Should find pools using default 5km radius
    assert isinstance(pools, list)


def test_nearby_pools_restaurant_filter(client, auth_user, set_user_location, other_user):
    """1️⃣2️⃣ Should filter by restaurant_id when provided."""
    # Create groups for different restaurants
    with client.application.app_context():
        db.session.add(Restaurant(id=2, name="Test Sushi", rating=4.5, location="Campus", offers="", image="🍣"))
        db.session.commit()
    
    # Set location for other user
    client.put("/api/discovery/update-location",
               json={"latitude": 35.7900, "longitude": -78.6680},
               headers=other_user["header"])
    
    # Create groups for restaurant 1 and 2
    for rest_id in [1, 2]:
        client.post("/api/groups", json={
            "name": f"Pool {rest_id}",
            "restaurant_id": rest_id,
            "deliveryType": "delivery",
            "deliveryLocation": "Campus",
            "nextOrderTime": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
            "visibility": "public"
        }, headers=other_user["header"])
    
    # Query for restaurant 1 only
    res = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=5&restaurant_id=1",
                     headers=auth_user["header"])
    
    pools = res.get_json()
    for pool in pools:
        assert pool["restaurant_id"] == 1


def test_nearby_pools_excludes_expired(client, auth_user, set_user_location, other_user):
    """1️⃣3️⃣ Should exclude groups with expired next_order_time."""
    client.put("/api/discovery/update-location",
               json={"latitude": 35.7900, "longitude": -78.6680},
               headers=other_user["header"])
    
    # Create expired group
    client.post("/api/groups", json={
        "name": "Expired Pool",
        "restaurant_id": 1,
        "deliveryType": "delivery",
        "deliveryLocation": "Campus",
        "nextOrderTime": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
        "visibility": "public"
    }, headers=other_user["header"])
    
    res = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=5",
                     headers=auth_user["header"])
    
    pools = res.get_json()
    # Should not include expired group
    for pool in pools:
        assert pool["name"] != "Expired Pool"


def test_nearby_pools_excludes_private(client, auth_user, set_user_location, other_user):
    """1️⃣4️⃣ Should only show public pools, not private ones."""
    client.put("/api/discovery/update-location",
               json={"latitude": 35.7900, "longitude": -78.6680},
               headers=other_user["header"])
    
    # Create private group
    client.post("/api/groups", json={
        "name": "Private Pool",
        "restaurant_id": 1,
        "deliveryType": "delivery",
        "deliveryLocation": "Campus",
        "nextOrderTime": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
        "visibility": "private"
    }, headers=other_user["header"])
    
    res = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=5",
                     headers=auth_user["header"])
    
    pools = res.get_json()
    for pool in pools:
        assert pool["name"] != "Private Pool"


def test_nearby_pools_membership_status(client, auth_user, set_user_location, nearby_group):
    """1️⃣5️⃣ Should indicate if user is already a member of a pool."""
    # Join the nearby group
    client.post(f"/api/groups/{nearby_group['id']}/join",
                headers=auth_user["header"])
    
    res = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=5",
                     headers=auth_user["header"])
    
    pools = res.get_json()
    joined_pool = next((p for p in pools if p["id"] == nearby_group["id"]), None)
    
    if joined_pool:
        assert "is_member" in joined_pool
        assert joined_pool["is_member"] is True


# -----------------------------------------------------------
# TEST CASES: Edge Cases & Error Handling (16-20)
# -----------------------------------------------------------

def test_nearby_pools_no_location_data(client, auth_user, set_user_location, other_user):
    """1️⃣6️⃣ Should exclude groups without location data."""
    # Create group without setting organizer's location
    with client.application.app_context():
        # Manually create group without location
        group = Group(
            name="No Location Pool",
            organizer="bob",
            restaurant_id=1,
            delivery_type="delivery",
            delivery_location="Unknown",
            next_order_time=datetime.now(timezone.utc) + timedelta(hours=2),
            visibility="public",
            latitude=None,
            longitude=None
        )
        db.session.add(group)
        db.session.commit()
    
    res = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=5",
                     headers=auth_user["header"])
    
    pools = res.get_json()
    for pool in pools:
        assert pool["name"] != "No Location Pool"


def test_nearby_pools_empty_results(client, auth_user, set_user_location):
    """1️⃣7️⃣ Should return empty array when no pools found."""
    # Query in middle of nowhere with small radius
    res = client.get("/api/discovery/nearby-pools?lat=0.0&lon=0.0&radius=0.1",
                     headers=auth_user["header"])
    
    assert res.status_code == 200
    pools = res.get_json()
    assert isinstance(pools, list)
    assert len(pools) == 0


def test_nearby_pools_unauthorized(client):
    """1️⃣8️⃣ Should require authentication."""
    res = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=5")
    assert res.status_code == 401


def test_nearby_pools_invalid_radius(client, auth_user, set_user_location):
    """1️⃣9️⃣ Should handle invalid radius values."""
    # Negative radius
    res = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=-5",
                     headers=auth_user["header"])
    assert res.status_code in [200, 400]  # May accept or reject
    
    # Very large radius
    res = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=10000",
                     headers=auth_user["header"])
    assert res.status_code == 200  # Should handle large values


def test_nearby_pools_invalid_coordinates(client, auth_user):
    """2️⃣0️⃣ Should handle invalid coordinate values."""
    # Out of range latitude
    res = client.get("/api/discovery/nearby-pools?lat=200&lon=-78.6647&radius=5",
                     headers=auth_user["header"])
    assert res.status_code in [200, 400]
    
    # Out of range longitude
    res = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=300&radius=5",
                     headers=auth_user["header"])
    assert res.status_code in [200, 400]


# -----------------------------------------------------------
# TEST CASES: Integration Scenarios (21-25)
# -----------------------------------------------------------

def test_discovery_full_workflow(client, auth_user, other_user):
    """2️⃣1️⃣ Complete discovery workflow: location update → create pool → discover."""
    # Alice updates location
    alice_res = client.put("/api/discovery/update-location",
                           json={"latitude": 35.7868, "longitude": -78.6647},
                           headers=auth_user["header"])
    assert alice_res.status_code == 200
    
    # Bob updates location nearby
    bob_res = client.put("/api/discovery/update-location",
                         json={"latitude": 35.7900, "longitude": -78.6680},
                         headers=other_user["header"])
    assert bob_res.status_code == 200
    
    # Bob creates a pool
    group_res = client.post("/api/groups", json={
        "name": "Bob's Pool",
        "restaurant_id": 1,
        "deliveryType": "delivery",
        "deliveryLocation": "Campus",
        "nextOrderTime": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
        "visibility": "public"
    }, headers=other_user["header"])
    assert group_res.status_code == 201
    
    # Alice discovers Bob's pool
    discover_res = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=5",
                              headers=auth_user["header"])
    assert discover_res.status_code == 200
    pools = discover_res.get_json()
    assert any(p["name"] == "Bob's Pool" for p in pools)


def test_multiple_users_nearby_pools(client, auth_user, other_user):
    """2️⃣2️⃣ Multiple users should see same nearby pools."""
    # Both users update to nearby locations
    client.put("/api/discovery/update-location",
               json={"latitude": 35.7868, "longitude": -78.6647},
               headers=auth_user["header"])
    
    client.put("/api/discovery/update-location",
               json={"latitude": 35.7870, "longitude": -78.6650},
               headers=other_user["header"])
    
    # Create a pool
    client.post("/api/groups", json={
        "name": "Shared Discovery Pool",
        "restaurant_id": 1,
        "deliveryType": "delivery",
        "deliveryLocation": "Campus",
        "nextOrderTime": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
        "visibility": "public"
    }, headers=other_user["header"])
    
    # Both users query
    alice_pools = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=5",
                             headers=auth_user["header"]).get_json()
    
    bob_pools = client.get("/api/discovery/nearby-pools?lat=35.7870&lon=-78.6650&radius=5",
                           headers=other_user["header"]).get_json()
    
    # Both should see the pool
    assert any(p["name"] == "Shared Discovery Pool" for p in alice_pools)
    assert any(p["name"] == "Shared Discovery Pool" for p in bob_pools)


def test_location_update_affects_pool_visibility(client, auth_user, other_user):
    """2️⃣3️⃣ Moving location should affect which pools are visible."""
    # Bob creates pool at location A
    client.put("/api/discovery/update-location",
               json={"latitude": 35.7900, "longitude": -78.6680},
               headers=other_user["header"])
    
    group = client.post("/api/groups", json={
        "name": "Static Pool",
        "restaurant_id": 1,
        "deliveryType": "delivery",
        "deliveryLocation": "Campus",
        "nextOrderTime": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
        "visibility": "public"
    }, headers=other_user["header"]).get_json()
    
    # Alice at nearby location - should see pool
    nearby_pools = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=5",
                              headers=auth_user["header"]).get_json()
    assert any(p["id"] == group["id"] for p in nearby_pools)
    
    # Alice moves far away - should not see pool
    far_pools = client.get("/api/discovery/nearby-pools?lat=35.0000&lon=-78.0000&radius=5",
                           headers=auth_user["header"]).get_json()
    assert not any(p["id"] == group["id"] for p in far_pools)


def test_distance_accuracy(client, auth_user, set_user_location, other_user):
    """2️⃣4️⃣ Distance calculations should be reasonably accurate."""
    # Create pool at known distance (~0.4km from alice)
    client.put("/api/discovery/update-location",
               json={"latitude": 35.7900, "longitude": -78.6680},
               headers=other_user["header"])
    
    group = client.post("/api/groups", json={
        "name": "Distance Test Pool",
        "restaurant_id": 1,
        "deliveryType": "delivery",
        "deliveryLocation": "Campus",
        "nextOrderTime": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
        "visibility": "public"
    }, headers=other_user["header"]).get_json()
    
    pools = client.get("/api/discovery/nearby-pools?lat=35.7868&lon=-78.6647&radius=5",
                       headers=auth_user["header"]).get_json()
    
    test_pool = next((p for p in pools if p["id"] == group["id"]), None)
    assert test_pool is not None
    # Distance should be roughly 0.4-0.6km
    assert 0.3 <= test_pool["distance_km"] <= 0.7


def test_concurrent_location_updates(client, auth_user):
    """2️⃣5️⃣ Multiple rapid location updates should work correctly."""
    locations = [
        (35.7868, -78.6647),
        (35.7900, -78.6680),
        (35.7850, -78.6700)
    ]
    
    for lat, lng in locations:
        res = client.put("/api/discovery/update-location",
                        json={"latitude": lat, "longitude": lng},
                        headers=auth_user["header"])
        assert res.status_code == 200
    
    # Verify final location persisted
    with client.application.app_context():
        user = User.query.filter_by(username="alice").first()
        assert user.latitude == 35.7850
        assert user.longitude == -78.6700