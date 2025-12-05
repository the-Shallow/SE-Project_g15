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
from models import User, Group, GroupMember, GroupOrder, GroupOrderItem
from extensions import db


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
def setup_test_data(client, auth_header):
    """Create test groups and orders for stats testing."""
    from datetime import datetime, timezone
    
    # Create a solo group (1 member)
    solo_group = Group(
        name="Solo Group",
        organizer="profileuser",
        restaurant_id=1,
        delivery_type="Delivery",
        delivery_location="Home",
        max_members=1,
        next_order_time=datetime.now(timezone.utc)
    )
    db.session.add(solo_group)
    db.session.flush()
    
    solo_member = GroupMember(group_id=solo_group.id, username="profileuser")
    db.session.add(solo_member)
    
    # Create solo order
    solo_order = GroupOrder(group_id=solo_group.id, username="profileuser")
    db.session.add(solo_order)
    db.session.flush()
    
    solo_item = GroupOrderItem(order_id=solo_order.id, menu_item_id=1, quantity=2)
    db.session.add(solo_item)
    
    # Create a pooled group (multiple members)
    pool_group = Group(
        name="Pool Group",
        organizer="otheruser",
        restaurant_id=2,
        delivery_type="Delivery",
        delivery_location="Office",
        max_members=5,
        next_order_time=datetime.now(timezone.utc)
    )
    db.session.add(pool_group)
    db.session.flush()
    
    pool_member1 = GroupMember(group_id=pool_group.id, username="profileuser")
    pool_member2 = GroupMember(group_id=pool_group.id, username="otheruser")
    db.session.add_all([pool_member1, pool_member2])
    
    # Create pooled order
    pool_order = GroupOrder(group_id=pool_group.id, username="profileuser")
    db.session.add(pool_order)
    db.session.flush()
    
    pool_item = GroupOrderItem(order_id=pool_order.id, menu_item_id=2, quantity=1)
    db.session.add(pool_item)
    
    db.session.commit()
    
    return {
        "solo_group": solo_group,
        "pool_group": pool_group,
        "solo_order": solo_order,
        "pool_order": pool_order
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
    # Should have 1 pooled order (only the one in pool_group)
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


def test_score_caps_at_100(client, auth_header):
    """1️⃣1️⃣ Score should cap at 100 even with many orders"""
    from datetime import datetime, timezone
    
    # Create 25 pooled groups with orders (exceeds max for scoring)
    for i in range(25):
        group = Group(
            name=f"Pool Group {i}",
            organizer="otheruser",
            restaurant_id=1,
            delivery_type="Delivery",
            delivery_location="Office",
            max_members=5,
            next_order_time=datetime.now(timezone.utc)
        )
        db.session.add(group)
        db.session.flush()
        
        member1 = GroupMember(group_id=group.id, username="profileuser")
        member2 = GroupMember(group_id=group.id, username="otheruser")
        db.session.add_all([member1, member2])
        
        order = GroupOrder(group_id=group.id, username="profileuser")
        db.session.add(order)
        db.session.flush()
        
        item = GroupOrderItem(order_id=order.id, menu_item_id=1, quantity=1)
        db.session.add(item)
    
    db.session.commit()
    
    response = client.get("/api/profile/me", headers=auth_header)
    data = response.get_json()
    stats = data["stats"]
    
    assert stats["score"] <= 100
    assert stats["total_orders"] >= 25
    assert stats["pooled_orders"] >= 25


def test_score_only_counts_pooled_orders(client, auth_header):
    """1️⃣2️⃣ Score should only count orders in groups with >1 member as pooled"""
    from datetime import datetime, timezone
    
    # Create 5 solo groups (1 member each)
    for i in range(5):
        group = Group(
            name=f"Solo Group {i}",
            organizer="profileuser",
            restaurant_id=1,
            delivery_type="Delivery",
            delivery_location="Home",
            max_members=1,
            next_order_time=datetime.now(timezone.utc)
        )
        db.session.add(group)
        db.session.flush()
        
        member = GroupMember(group_id=group.id, username="profileuser")
        db.session.add(member)
        
        order = GroupOrder(group_id=group.id, username="profileuser")
        db.session.add(order)
        db.session.flush()
        
        item = GroupOrderItem(order_id=order.id, menu_item_id=1, quantity=1)
        db.session.add(item)
    
    db.session.commit()
    
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


def test_stats_update_after_new_order(client, auth_header, setup_test_data):
    """1️⃣4️⃣ Stats should update when new orders are placed"""
    # Get initial stats
    response1 = client.get("/api/profile/me", headers=auth_header)
    initial_stats = response1.get_json()["stats"]
    initial_total = initial_stats["total_orders"]
    
    # Create a new pooled order
    from datetime import datetime, timezone
    
    new_group = Group(
        name="New Pool Group",
        organizer="otheruser",
        restaurant_id=3,
        delivery_type="Delivery",
        delivery_location="Campus",
        max_members=5,
        next_order_time=datetime.now(timezone.utc)
    )
    db.session.add(new_group)
    db.session.flush()
    
    member1 = GroupMember(group_id=new_group.id, username="profileuser")
    member2 = GroupMember(group_id=new_group.id, username="otheruser")
    db.session.add_all([member1, member2])
    
    new_order = GroupOrder(group_id=new_group.id, username="profileuser")
    db.session.add(new_order)
    db.session.flush()
    
    new_item = GroupOrderItem(order_id=new_order.id, menu_item_id=3, quantity=1)
    db.session.add(new_item)
    db.session.commit()
    
    # Get updated stats
    response2 = client.get("/api/profile/me", headers=auth_header)
    updated_stats = response2.get_json()["stats"]
    
    assert updated_stats["total_orders"] == initial_total + 1
    assert updated_stats["pooled_orders"] == initial_stats["pooled_orders"] + 1
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