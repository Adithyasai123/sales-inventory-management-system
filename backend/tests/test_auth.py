import pytest
from fastapi.testclient import TestClient


def test_login_success(client: TestClient, seed_data):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


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
    # 1. Login to get refresh token
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "sales@test.com", "password": "Password123!"},
    )
    refresh_token = login_res.json()["refresh_token"]

    # 2. Refresh tokens
    refresh_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 200
    new_data = refresh_res.json()
    assert "access_token" in new_data
    assert "refresh_token" in new_data


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
