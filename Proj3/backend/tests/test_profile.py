"""
Profile Test Suite
------------------
Covers user profile management with stats, achievements, and leaderboard:
✅ Profile retrieval with stats
✅ Profile updates
✅ Stats calculation (total orders, pooled orders, score)
✅ Validation & Security
✅ Authorization checks
"""

import pytest
from datetime import datetime, timezone, timedelta


def get_future_time(hours=2):
    """Helper to get properly formatted future datetime in UTC"""
    future_time = datetime.now(timezone.utc) + timedelta(hours=hours)
    # Format as ISO string and replace '+00:00' with 'Z'
    return future_time.isoformat().replace('+00:00', 'Z')


@pytest.fixture
def auth_header(client):
    """Register + login to get JWT token header for profile tests."""
    client.post(
        "/api/auth/register",
        json={
            "username": "profileuser",
            "email": "profile@example.com",
            "password": "testpass",
        },
    )
    login_resp = client.post(
        "/api/auth/login", json={"username": "profileuser", "password": "testpass"}
    )
    token = login_resp.get_json().get("token")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_user_header(client):
    """Create another user for multi-user group tests."""
    client.post(
        "/api/auth/register",
        json={
            "username": "otheruser",
            "email": "other@example.com",
            "password": "testpass",
        },
    )
    login_resp = client.post(
        "/api/auth/login", json={"username": "otheruser", "password": "testpass"}
    )
    token = login_resp.get_json().get("token")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def setup_test_data(client, auth_header, other_user_header):
    """Create test groups and orders for stats testing."""
    # Create a solo group (1 member) - profileuser is organizer
    solo_group_data = {
        "name": "Solo Group",
        "restaurant_id": 1,
        "deliveryType": "Delivery",
        "deliveryLocation": "Home",
        "maxMembers": 1,
        "nextOrderTime": get_future_time(2)
    }
    solo_response = client.post("/api/groups", json=solo_group_data, headers=auth_header)
    
    if solo_response.status_code != 201:
        print(f"Solo group creation failed: {solo_response.get_json()}")
    
    assert solo_response.status_code == 201, f"Failed to create solo group: {solo_response.get_json()}"
    solo_group = solo_response.get_json()
    
    # Create solo order
    solo_order_data = {
        "items": [{"menuItemId": 1, "quantity": 2}],
        "nextOrderTime": solo_group["nextOrderTime"]
    }
    solo_order_response = client.post(
        f"/api/groups/{solo_group['id']}/orders",
        json=solo_order_data,
        headers=auth_header
    )
    
    if solo_order_response.status_code != 201:
        print(f"Solo order creation failed: {solo_order_response.get_json()}")
    
    assert solo_order_response.status_code == 201, f"Failed to create solo order: {solo_order_response.get_json()}"
    
    # Create a pooled group (otheruser is organizer)
    pool_group_data = {
        "name": "Pool Group",
        "restaurant_id": 2,
        "deliveryType": "Delivery",
        "deliveryLocation": "Office",
        "maxMembers": 5,
        "nextOrderTime": get_future_time(3)
    }
    pool_response = client.post("/api/groups", json=pool_group_data, headers=other_user_header)
    
    if pool_response.status_code != 201:
        print(f"Pool group creation failed: {pool_response.get_json()}")
    
    assert pool_response.status_code == 201, f"Failed to create pool group: {pool_response.get_json()}"
    pool_group = pool_response.get_json()
    
    # profileuser joins the pool group
    join_response = client.post(
        f"/api/groups/{pool_group['id']}/join",
        headers=auth_header
    )
    assert join_response.status_code == 200, f"Failed to join pool group: {join_response.get_json()}"
    
    # profileuser places order in pool group
    pool_order_data = {
        "items": [{"menuItemId": 2, "quantity": 1}],
        "nextOrderTime": pool_group["nextOrderTime"]
    }
    pool_order_response = client.post(
        f"/api/groups/{pool_group['id']}/orders",
        json=pool_order_data,
        headers=auth_header
    )
    
    if pool_order_response.status_code != 201:
        print(f"Pool order creation failed: {pool_order_response.get_json()}")
    
    assert pool_order_response.status_code == 201, f"Failed to create pool order: {pool_order_response.get_json()}"
    
    return {
        "solo_group": solo_group,
        "pool_group": pool_group
    }


# ==================== TEST CASES 1-4: GET Profile with Stats ====================


def test_get_own_profile_success(client, auth_header):
    """1️⃣ Should retrieve own profile with valid token"""
    response = client.get("/api/profile/me", headers=auth_header)
    assert response.status_code == 200
    data = response.get_json()
    assert "username" in data
    assert data["username"] == "profileuser"
    assert "email" in data
    assert "stats" in data


def test_get_profile_includes_stats(client, auth_header, setup_test_data):
    """2️⃣ Should include stats object with total_orders, pooled_orders, and score"""
    response = client.get("/api/profile/me", headers=auth_header)
    assert response.status_code == 200
    data = response.get_json()
    
    assert "stats" in data
    stats = data["stats"]
    
    assert "total_orders" in stats
    assert "pooled_orders" in stats
    assert "score" in stats
    
    # Should have 2 total orders (1 solo + 1 pooled)
    assert stats["total_orders"] == 2
    # Should have 1 pooled order (only the one in pool_group with 2+ members)
    assert stats["pooled_orders"] == 1
    # Score should be calculated
    assert isinstance(stats["score"], int)
    assert 0 <= stats["score"] <= 100


def test_stats_calculation_accuracy(client, auth_header, setup_test_data):
    """3️⃣ Should calculate stats accurately based on orders"""
    response = client.get("/api/profile/me", headers=auth_header)
    data = response.get_json()
    stats = data["stats"]
    
    # With 2 total orders and 1 pooled order:
    # total_orders_score = (2/20) * 50 = 5
    # pooled_orders_score = (1/20) * 50 = 2.5
    # total_score = 5 + 2.5 = 7.5 (rounded to 8)
    expected_score = round((2/20) * 50 + (1/20) * 50)
    assert stats["score"] == expected_score


def test_stats_with_no_orders(client, auth_header):
    """4️⃣ Should return zero stats when user has no orders"""
    response = client.get("/api/profile/me", headers=auth_header)
    data = response.get_json()
    stats = data["stats"]
    
    assert stats["total_orders"] == 0
    assert stats["pooled_orders"] == 0
    assert stats["score"] == 0


def test_get_profile_without_auth(client):
    """5️⃣ Should deny access without authentication token"""
    response = client.get("/api/profile/me")
    assert response.status_code == 401


def test_get_profile_invalid_token(client):
    """6️⃣ Should reject invalid/malformed tokens"""
    headers = {"Authorization": "Bearer invalidtoken123"}
    response = client.get("/api/profile/me", headers=headers)
    assert response.status_code in [401, 422]


# ==================== TEST CASES 7-10: UPDATE Profile ====================


def test_update_profile_success(client, auth_header):
    """7️⃣ Should update profile fields successfully"""
    update_data = {"full_name": "Test User", "city": "Test City"}
    response = client.put("/api/profile/me", data=update_data, headers=auth_header)
    assert response.status_code == 200
    
    # Verify update persisted
    get_response = client.get("/api/profile/me", headers=auth_header)
    profile_data = get_response.get_json()
    assert profile_data["full_name"] == "Test User"
    assert profile_data["city"] == "Test City"


def test_update_profile_partial_fields(client, auth_header):
    """8️⃣ Should allow partial profile updates"""
    response = client.put(
        "/api/profile/me", data={"city": "New City"}, headers=auth_header
    )
    assert response.status_code == 200


def test_update_profile_without_auth(client):
    """9️⃣ Should deny profile update without auth"""
    response = client.put("/api/profile/me", data={"city": "Test"})
    assert response.status_code == 401


def test_profile_password_not_exposed(client, auth_header):
    """🔟 Profile response should never expose password"""
    response = client.get("/api/profile/me", headers=auth_header)
    assert response.status_code == 200
    data = response.get_json()
    assert "password" not in data
    assert "password_hash" not in data


# ==================== TEST CASES 11-14: Score Calculation Edge Cases ====================


def test_score_caps_at_100(client, auth_header, other_user_header):
    """1️⃣1️⃣ Score should cap at 100 even with many orders"""
    # Create 25 pooled groups with orders (exceeds max for scoring)
    for i in range(25):
        # Other user creates group
        group_data = {
            "name": f"Pool Group {i}",
            "restaurant_id": 1,
            "deliveryType": "Delivery",
            "deliveryLocation": f"Office {i}",
            "maxMembers": 5,
            "nextOrderTime": get_future_time(i+1)
        }
        group_response = client.post("/api/groups", json=group_data, headers=other_user_header)
        
        if group_response.status_code != 201:
            print(f"Group {i} creation failed: {group_response.get_json()}")
            
        assert group_response.status_code == 201, f"Failed to create group {i}: {group_response.get_json()}"
        group = group_response.get_json()
        
        # profileuser joins the group
        join_response = client.post(f"/api/groups/{group['id']}/join", headers=auth_header)
        assert join_response.status_code == 200
        
        # profileuser places order
        order_data = {
            "items": [{"menuItemId": 1, "quantity": 1}],
            "nextOrderTime": group["nextOrderTime"]
        }
        order_response = client.post(
            f"/api/groups/{group['id']}/orders",
            json=order_data,
            headers=auth_header
        )
        assert order_response.status_code == 201
    
    response = client.get("/api/profile/me", headers=auth_header)
    data = response.get_json()
    stats = data["stats"]
    
    assert stats["score"] <= 100
    assert stats["total_orders"] >= 25
    assert stats["pooled_orders"] >= 25


def test_score_only_counts_pooled_orders(client, auth_header):
    """1️⃣2️⃣ Score should only count orders in groups with >1 member as pooled"""
    # Create 5 solo groups (1 member each)
    for i in range(5):
        group_data = {
            "name": f"Solo Group {i}",
            "restaurant_id": 1,
            "deliveryType": "Delivery",
            "deliveryLocation": f"Home {i}",
            "maxMembers": 1,
            "nextOrderTime": get_future_time(i+1)
        }
        group_response = client.post("/api/groups", json=group_data, headers=auth_header)
        
        if group_response.status_code != 201:
            print(f"Solo group {i} creation failed: {group_response.get_json()}")
            
        assert group_response.status_code == 201, f"Failed to create solo group {i}: {group_response.get_json()}"
        group = group_response.get_json()
        
        # Create order in solo group
        order_data = {
            "items": [{"menuItemId": 1, "quantity": 1}],
            "nextOrderTime": group["nextOrderTime"]
        }
        order_response = client.post(
            f"/api/groups/{group['id']}/orders",
            json=order_data,
            headers=auth_header
        )
        assert order_response.status_code == 201
    
    response = client.get("/api/profile/me", headers=auth_header)
    data = response.get_json()
    stats = data["stats"]
    
    # Should have 5 total orders but 0 pooled orders
    assert stats["total_orders"] == 5
    assert stats["pooled_orders"] == 0


def test_past_orders_endpoint(client, auth_header, setup_test_data):
    """1️⃣3️⃣ Should retrieve past orders correctly"""
    response = client.get("/api/profile/orders", headers=auth_header)
    assert response.status_code == 200
    
    orders = response.get_json()
    assert isinstance(orders, list)
    assert len(orders) == 2  # Should have 2 orders from setup


def test_stats_update_after_new_order(client, auth_header, other_user_header, setup_test_data):
    """1️⃣4️⃣ Stats should update when new orders are placed"""
    # Get initial stats
    response1 = client.get("/api/profile/me", headers=auth_header)
    initial_stats = response1.get_json()["stats"]
    initial_total = initial_stats["total_orders"]
    initial_pooled = initial_stats["pooled_orders"]
    
    # Create a new pooled group (otheruser creates it)
    new_group_data = {
        "name": "New Pool Group",
        "restaurant_id": 3,
        "deliveryType": "Delivery",
        "deliveryLocation": "Campus",
        "maxMembers": 5,
        "nextOrderTime": get_future_time(5)
    }
    new_group_response = client.post("/api/groups", json=new_group_data, headers=other_user_header)
    assert new_group_response.status_code == 201
    new_group = new_group_response.get_json()
    
    # profileuser joins
    join_response = client.post(f"/api/groups/{new_group['id']}/join", headers=auth_header)
    assert join_response.status_code == 200
    
    # profileuser places order
    new_order_data = {
        "items": [{"menuItemId": 3, "quantity": 1}],
        "nextOrderTime": new_group["nextOrderTime"]
    }
    new_order_response = client.post(
        f"/api/groups/{new_group['id']}/orders",
        json=new_order_data,
        headers=auth_header
    )
    assert new_order_response.status_code == 201
    
    # Get updated stats
    response2 = client.get("/api/profile/me", headers=auth_header)
    updated_stats = response2.get_json()["stats"]
    
    assert updated_stats["total_orders"] == initial_total + 1
    assert updated_stats["pooled_orders"] == initial_pooled + 1
    assert updated_stats["score"] > initial_stats["score"]


# ==================== TEST CASE 15: Profile Picture ====================


def test_update_profile_with_picture(client, auth_header):
    """1️⃣5️⃣ Should handle profile picture upload"""
    import io
    
    data = {
        "full_name": "Test User",
        "profile_picture": (io.BytesIO(b"fake image data"), "test.jpg")
    }
    
    response = client.put(
        "/api/profile/me",
        data=data,
        headers=auth_header,
        content_type="multipart/form-data"
    )
    
    assert response.status_code == 200
    result = response.get_json()
    assert "profile_picture" in result or "message" in result


# ==================== Additional Edge Case Tests ====================


def test_profile_stats_with_mixed_orders(client, auth_header, other_user_header):
    """Should correctly count mixed solo and pooled orders"""
    # Create 3 solo orders
    for i in range(3):
        group_data = {
            "name": f"Solo {i}",
            "restaurant_id": 1,
            "deliveryType": "Delivery",
            "deliveryLocation": "Home",
            "maxMembers": 1,
            "nextOrderTime": get_future_time(i+1)
        }
        group_response = client.post("/api/groups", json=group_data, headers=auth_header)
        assert group_response.status_code == 201
        group = group_response.get_json()
        
        order_data = {
            "items": [{"menuItemId": 1, "quantity": 1}],
            "nextOrderTime": group["nextOrderTime"]
        }
        order_response = client.post(
            f"/api/groups/{group['id']}/orders", 
            json=order_data, 
            headers=auth_header
        )
        assert order_response.status_code == 201
    
    # Create 2 pooled orders
    for i in range(2):
        group_data = {
            "name": f"Pool {i}",
            "restaurant_id": 1,
            "deliveryType": "Delivery",
            "deliveryLocation": "Office",
            "maxMembers": 5,
            "nextOrderTime": get_future_time(i+4)
        }
        group_response = client.post("/api/groups", json=group_data, headers=other_user_header)
        assert group_response.status_code == 201
        group = group_response.get_json()
        
        join_response = client.post(f"/api/groups/{group['id']}/join", headers=auth_header)
        assert join_response.status_code == 200
        
        order_data = {
            "items": [{"menuItemId": 1, "quantity": 1}],
            "nextOrderTime": group["nextOrderTime"]
        }
        order_response = client.post(
            f"/api/groups/{group['id']}/orders", 
            json=order_data, 
            headers=auth_header
        )
        assert order_response.status_code == 201
    
    response = client.get("/api/profile/me", headers=auth_header)
    stats = response.get_json()["stats"]
    
    assert stats["total_orders"] == 5
    assert stats["pooled_orders"] == 2
    
    # Score should be: (5/20)*50 + (2/20)*50 = 12.5 + 5 = 17.5 => 18
    expected = round((5/20)*50 + (2/20)*50)
    assert stats["score"] == expected