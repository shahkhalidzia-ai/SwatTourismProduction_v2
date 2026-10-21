import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_auth_refresh_token_rotation(async_client: AsyncClient):
    # Register a new user
    reg_payload = {
        "email": "rotatetest@swattourism.pk",
        "password": "Password123!",
        "full_name": "Rotate User",
        "role": "tourist",
    }
    reg_res = await async_client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    refresh_token = reg_res.json()["refresh_token"]

    # Call /refresh
    refresh_res = await async_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_res.status_code == 200
    data = refresh_res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_account_lockout_after_five_failed_attempts(async_client: AsyncClient):
    # Register user
    email = "lockouttest@swattourism.pk"
    reg_payload = {
        "email": email,
        "password": "CorrectPassword123!",
        "full_name": "Lockout Candidate",
        "role": "tourist",
    }
    reg_res = await async_client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201

    # 4 consecutive bad logins -> 401
    for _ in range(4):
        res = await async_client.post(
            "/api/v1/auth/login",
            json={"username": email, "password": "WrongPassword!"}
        )
        assert res.status_code == 401

    # 5th bad login -> 401 and activates lockout
    res5 = await async_client.post(
        "/api/v1/auth/login",
        json={"username": email, "password": "WrongPassword!"}
    )
    assert res5.status_code == 401

    # 6th attempt (even with correct password) -> 403 Forbidden due to lockout
    res6 = await async_client.post(
        "/api/v1/auth/login",
        json={"username": email, "password": "CorrectPassword123!"}
    )
    assert res6.status_code == 403
    assert "temporarily locked" in res6.json()["detail"]


@pytest.mark.asyncio
async def test_password_reset_workflow(async_client: AsyncClient):
    email = "resettest@swattourism.pk"
    reg_payload = {
        "email": email,
        "password": "OldPassword123!",
        "full_name": "Reset Candidate",
        "role": "tourist",
    }
    reg_res = await async_client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201

    # Forgot password request
    forgot_res = await async_client.post(
        "/api/v1/auth/forgot-password",
        json={"email_or_phone": email}
    )
    assert forgot_res.status_code == 200
    forgot_data = forgot_res.json()
    assert forgot_data["success"] is True
    token = forgot_data["data"]["token"]

    # Reset password with valid token
    reset_res = await async_client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "NewBrandPassword123!"}
    )
    assert reset_res.status_code == 200
    assert reset_res.json()["success"] is True

    # Login with new password succeeds
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"username": email, "password": "NewBrandPassword123!"}
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()


@pytest.mark.asyncio
async def test_phone_otp_verification(async_client: AsyncClient):
    phone = "+923001234888"
    reg_payload = {
        "phone": phone,
        "password": "Password123!",
        "full_name": "OTP User",
        "role": "tourist",
    }
    reg_res = await async_client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201

    # Send OTP
    send_res = await async_client.post(
        "/api/v1/auth/phone-otp/send",
        json={"phone": phone}
    )
    assert send_res.status_code == 200
    otp = send_res.json()["data"]["otp"]

    # Verify with correct OTP
    verify_res = await async_client.post(
        "/api/v1/auth/phone-otp/verify",
        json={"phone": phone, "otp": otp}
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["success"] is True
