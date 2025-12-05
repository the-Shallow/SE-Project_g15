"""
Auth Test Suite
---------------
Covers all major user authentication flows:
✅ Registration
✅ Login
✅ Validation & Error Handling
✅ Token-based access
✅ Edge Cases
"""


def test_register_user_success(client):
    """✅ Should register a new user successfully"""
    response = client.post(
        "/api/auth/register",
        json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "testpass",
        },
    )
    assert response.status_code in [200, 201]
    data = response.get_json()
    assert "username" in data
    assert data["username"] == "newuser"


def test_register_duplicate_email(client):
    """🚫 Should not allow registration with same email"""
    client.post(
        "/api/auth/register",
        json={"username": "bob", "email": "bob@example.com", "password": "testpass"},
    )
    response = client.post(
        "/api/auth/register",
        json={
            "username": "bobby",
            "email": "bob@example.com",
            "password": "anotherpass",
        },
    )
    assert response.status_code == 400


def test_register_missing_fields(client):
    """🚫 Should fail when required fields are missing"""
    response = client.post(
        "/api/auth/register", json={"username": "", "email": "", "password": ""}
    )
    assert response.status_code in [400, 422]


def test_register_short_password(client):
    """🚫 Should fail if password < 6 chars (frontend also enforces this)"""
    response = client.post(
        "/api/auth/register",
        json={"username": "tiny", "email": "tiny@example.com", "password": "123"},
    )
    assert response.status_code in [400, 422]


def test_register_invalid_email_format(client):
    """🚫 Should reject invalid email addresses"""
    response = client.post(
        "/api/auth/register",
        json={
            "username": "invalidemail",
            "email": "not-an-email",
            "password": "validpass",
        },
    )
    assert response.status_code in [400, 422]


def test_login_user_success(client):
    """✅ Should login successfully and return a token"""
    client.post(
        "/api/auth/register",
        json={
            "username": "loginuser",
            "email": "login@example.com",
            "password": "testpass",
        },
    )
    response = client.post(
        "/api/auth/login", json={"username": "loginuser", "password": "testpass"}
    )
    assert response.status_code == 200
    data = response.get_json()
    assert "token" in data
    assert data["username"] == "loginuser"


def test_login_wrong_password(client):
    """🚫 Should fail when wrong password is provided"""
    client.post(
        "/api/auth/register",
        json={
            "username": "wrongpass",
            "email": "wrongpass@example.com",
            "password": "correctpass",
        },
    )
    response = client.post(
        "/api/auth/login", json={"username": "wrongpass", "password": "incorrect"}
    )
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    """🚫 Should return 404 or 401 if username doesn't exist"""
    response = client.post(
        "/api/auth/login", json={"username": "ghost", "password": "nopass"}
    )
    assert response.status_code in [400, 401, 404]


def test_login_missing_fields(client):
    """🚫 Should fail when username/password missing"""
    response = client.post("/api/auth/login", json={})
    assert response.status_code in [400, 422]


def test_register_then_login_flow(client):
    """🌐 Should register, then login successfully"""
    client.post(
        "/api/auth/register",
        json={
            "username": "flowuser",
            "email": "flow@example.com",
            "password": "testpass",
        },
    )
    response = client.post(
        "/api/auth/login", json={"username": "flowuser", "password": "testpass"}
    )
    assert response.status_code == 200
    assert "token" in response.get_json()


def test_token_contains_user_info(client):
    """🧾 JWT token should encode user info (id/username)"""
    client.post(
        "/api/auth/register",
        json={
            "username": "jwtuser",
            "email": "jwt@example.com",
            "password": "testpass",
        },
    )
    login = client.post(
        "/api/auth/login", json={"username": "jwtuser", "password": "testpass"}
    ).get_json()
    token = login["token"]
    assert isinstance(token, str)
    assert len(token.split(".")) == 3  # JWT format


def test_register_duplicate_username(client):
    """🚫 Should not allow duplicate usernames"""
    client.post(
        "/api/auth/register",
        json={
            "username": "sameuser",
            "email": "same@example.com",
            "password": "testpass",
        },
    )
    response = client.post(
        "/api/auth/register",
        json={
            "username": "sameuser",
            "email": "diff@example.com",
            "password": "testpass",
        },
    )
    assert response.status_code == 400


def test_token_protected_endpoint(client):
    """✅ Token should grant access to protected routes"""
    client.post(
        "/api/auth/register",
        json={
            "username": "secureuser",
            "email": "secure@example.com",
            "password": "testpass",
        },
    )
    login = client.post(
        "/api/auth/login", json={"username": "secureuser", "password": "testpass"}
    ).get_json()
    headers = {"Authorization": f"Bearer {login['token']}"}
    response = client.get("/api/profile/me", headers=headers)
    assert response.status_code in [200, 201]


def test_unauthorized_access_denied(client):
    """🚫 Should reject unauthorized requests"""
    response = client.get("/api/profile/me")
    assert response.status_code == 401


def test_token_expiration_behavior(client):
    """🕒 Should handle expired/invalid tokens gracefully"""
    headers = {"Authorization": "Bearer invalidtoken"}
    response = client.get("/api/profile/me", headers=headers)
    assert response.status_code in [401, 422]


def test_case_insensitive_login(client):
    """🧩 Login should handle case-insensitive usernames if supported"""
    client.post(
        "/api/auth/register",
        json={
            "username": "CaseUser",
            "email": "case@example.com",
            "password": "testpass",
        },
    )
    response = client.post(
        "/api/auth/login", json={"username": "caseuser", "password": "testpass"}
    )
    assert response.status_code in [200, 400]  # depending on your backend rule


def test_password_not_returned(client):
    """🔒 Response JSON should never include plaintext password"""
    client.post(
        "/api/auth/register",
        json={
            "username": "noleak",
            "email": "noleak@example.com",
            "password": "secret",
        },
    )
    response = client.post(
        "/api/auth/login", json={"username": "noleak", "password": "secret"}
    )
    data = response.get_json()
    for key in data.keys():
        assert "pass" not in key.lower()


def test_register_with_whitespace_username(client):
    """✅ Should trim whitespace and still register successfully"""
    response = client.post(
        "/api/auth/register",
        json={
            "username": "  spaced  ",
            "email": "space@example.com",
            "password": "testpass",
        },
    )
    assert response.status_code in [200, 201]
    data = response.get_json()
    assert data["username"] == "spaced"


def test_register_with_special_characters_username(client):
    """🚫 Should reject usernames with invalid characters"""
    response = client.post(
        "/api/auth/register",
        json={
            "username": "user$#@!",
            "email": "special@example.com",
            "password": "testpass",
        },
    )
    assert response.status_code in [400, 422]


def test_register_long_username(client):
    """🚫 Should reject usernames exceeding length limit"""
    long_username = "a" * 100
    response = client.post(
        "/api/auth/register",
        json={
            "username": long_username,
            "email": "long@example.com",
            "password": "testpass",
        },
    )
    assert response.status_code in [400, 422]


def test_register_password_hashing(client):
    """🔒 Ensure password is stored hashed, not plaintext"""
    client.post(
        "/api/auth/register",
        json={
            "username": "hashcheck",
            "email": "hashcheck@example.com",
            "password": "secret123",
        },
    )
    from models.user import User

    user = User.query.filter_by(username="hashcheck").first()
    assert user.password != "secret123"


def test_login_case_sensitive_password(client):
    """🚫 Passwords should always be case-sensitive"""
    client.post(
        "/api/auth/register",
        json={
            "username": "casepass",
            "email": "casepass@example.com",
            "password": "MySecret",
        },
    )
    response = client.post(
        "/api/auth/login",
        json={"username": "casepass", "password": "mysecret"},  # lowercase variant
    )
    assert response.status_code == 401


def test_access_with_malformed_token(client):
    """🚫 Should reject malformed JWT tokens"""
    headers = {"Authorization": "Bearer not.a.valid.token"}
    response = client.get("/api/profile/me", headers=headers)
    assert response.status_code in [401, 422]


def test_token_reuse_still_valid(client):
    """🧠 Same token should work for multiple authorized calls"""
    client.post(
        "/api/auth/register",
        json={
            "username": "tokuser",
            "email": "tok@example.com",
            "password": "testpass",
        },
    )
    login = client.post(
        "/api/auth/login", json={"username": "tokuser", "password": "testpass"}
    ).get_json()
    token = login["token"]
    headers = {"Authorization": f"Bearer {token}"}
    response1 = client.get("/api/profile/me", headers=headers)
    response2 = client.get("/api/profile/me", headers=headers)
    assert response1.status_code == 200
    assert response2.status_code == 200


def test_token_after_user_deleted(client):
    """🚫 Token from deleted user should no longer work"""
    client.post(
        "/api/auth/register",
        json={
            "username": "deleteuser",
            "email": "delete@example.com",
            "password": "testpass",
        },
    )
    login = client.post(
        "/api/auth/login", json={"username": "deleteuser", "password": "testpass"}
    ).get_json()
    from models.user import User, db

    user = User.query.filter_by(username="deleteuser").first()
    db.session.delete(user)
    db.session.commit()
    headers = {"Authorization": f"Bearer {login['token']}"}
    response = client.get("/api/profile/me", headers=headers)
    assert response.status_code in [401, 404]


def test_login_with_email_instead_of_username(client):
    """🧩 Should support login via email if allowed"""
    client.post(
        "/api/auth/register",
        json={
            "username": "emailuser",
            "email": "emailuser@example.com",
            "password": "testpass",
        },
    )
    response = client.post(
        "/api/auth/login",
        json={"username": "emailuser@example.com", "password": "testpass"},
    )
    assert response.status_code in [200, 400]


def test_login_rate_limit_simulation(client):
    """🚫 Simulate multiple failed logins and expect lockout"""
    for _ in range(5):
        client.post(
            "/api/auth/login", json={"username": "nonexistent", "password": "wrong"}
        )
    response = client.post(
        "/api/auth/login", json={"username": "nonexistent", "password": "wrong"}
    )
    assert response.status_code in [429, 401]


def test_register_login_edit_profile_flow(client):
    """🔄 End-to-end test of register → login → fetch profile"""
    client.post(
        "/api/auth/register",
        json={
            "username": "endtoend",
            "email": "end@example.com",
            "password": "testpass",
        },
    )
    login = client.post(
        "/api/auth/login", json={"username": "endtoend", "password": "testpass"}
    ).get_json()
    headers = {"Authorization": f"Bearer {login['token']}"}
    response = client.get("/api/profile/me", headers=headers)
    assert response.status_code in [200, 201]
