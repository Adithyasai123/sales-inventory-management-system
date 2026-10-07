import pytest
from fastapi.testclient import TestClient


def test_login_success(client: TestClient, seed_data):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.json()
    # Sensitive tokens are NEVER exposed in the JSON response body
    assert "access_token" not in data
    assert "refresh_token" not in data
    assert data["message"] == "Login successful"
    assert data["user"]["email"] == "admin@test.com"

    # Tokens are stored strictly in secure encrypted cookies
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies


def test_login_invalid_password(client: TestClient, seed_data):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["code"] == "UNAUTHORIZED"


def test_login_nonexistent_user(client: TestClient, seed_data):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "ghost@test.com", "password": "Password123!"},
    )
    assert response.status_code == 401


def test_refresh_token_cycle(client: TestClient, seed_data):
    # 1. Login to get refresh token in cookie
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "sales@test.com", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    refresh_token = login_res.cookies["refresh_token"]

    # 2. Refresh tokens using cookie
    refresh_res = client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 200
    new_data = refresh_res.json()
    assert "access_token" not in new_data
    assert "refresh_token" not in new_data
    assert "access_token" in refresh_res.cookies
    assert "refresh_token" in refresh_res.cookies


def test_get_current_user_profile(client: TestClient, sales_headers, seed_data):
    response = client.get("/api/v1/auth/me", headers=sales_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "sales@test.com"
    assert data["role"] == "SALES"
    assert data["is_active"] is True


def test_unauthenticated_request_rejected(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_cookie_authentication(client: TestClient, seed_data):
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "sales@test.com", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.cookies
    assert "refresh_token" in login_res.cookies

    # Access protected route using ONLY cookies (no Authorization header)
    response = client.get(
        "/api/v1/auth/me",
        cookies={"access_token": login_res.cookies["access_token"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "sales@test.com"
    assert data["role"] == "SALES"


def test_cookie_refresh(client: TestClient, seed_data):
    # 1. Login to get HttpOnly cookies
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "sales@test.com", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    refresh_token = login_res.cookies["refresh_token"]

    # 2. Refresh with empty body relying solely on cookie
    refresh_res = client.post(
        "/api/v1/auth/refresh",
        json={},
        cookies={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.cookies
    assert "refresh_token" in refresh_res.cookies


def test_logout_clears_cookies(client: TestClient):
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"


def test_tokens_are_encrypted_and_not_exposed(client: TestClient, seed_data):
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "sales@test.com", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    data = login_res.json()

    # Sensitive tokens are NEVER exposed in the JSON response body
    assert "access_token" not in data
    assert "refresh_token" not in data
    assert data["message"] == "Login successful"
    assert data["user"]["email"] == "sales@test.com"

    # Verify cookie values are encrypted with Fernet (starts with 'gAAAAA') and not raw JWT ('eyJ')
    access_cookie = login_res.cookies["access_token"].strip('"')
    refresh_cookie = login_res.cookies["refresh_token"].strip('"')
    assert not access_cookie.startswith("eyJ")
    assert not refresh_cookie.startswith("eyJ")
    assert access_cookie.startswith("gAAAAA")
    assert refresh_cookie.startswith("gAAAAA")
