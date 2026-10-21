import pytest


@pytest.mark.asyncio
async def test_register_tourist(async_client):
    payload = {
        "email": "test.tourist@example.com",
        "phone": "+923001234567",
        "password": "Password123!",
        "full_name": "Test Tourist",
        "role": "tourist",
        "home_city": "Lahore",
        "emergency_contact_name": "Emergency Person",
        "emergency_contact_phone": "+923007654321",
    }
    response = await async_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "test.tourist@example.com"
    assert data["user"]["role"] == "tourist"
    assert data["user"]["tourist_profile"]["home_city"] == "Lahore"


@pytest.mark.asyncio
async def test_register_duplicate_email(async_client):
    payload = {
        "email": "dup.tourist@example.com",
        "phone": "+923008889900",
        "password": "Password123!",
        "full_name": "Original Person",
        "role": "tourist",
    }
    # First registration
    res1 = await async_client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # Second registration with same email
    res2 = await async_client.post("/api/v1/auth/register", json={
        "email": "dup.tourist@example.com",
        "phone": "+923009990011",
        "password": "AnotherPassword123!",
        "full_name": "Duplicate Person",
        "role": "tourist",
    })
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_login_success_and_failure(async_client):
    # Register user first
    reg = {
        "email": "login.test@example.com",
        "password": "CorrectPassword123!",
        "full_name": "Login Tester",
        "role": "tourist",
    }
    reg_res = await async_client.post("/api/v1/auth/register", json=reg)
    assert reg_res.status_code == 201

    # Valid login
    login_payload = {
        "username": "login.test@example.com",
        "password": "CorrectPassword123!",
    }
    res = await async_client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 200
    token = res.json()["access_token"]
    assert token is not None

    # Invalid password
    bad_login = {
        "username": "login.test@example.com",
        "password": "WrongPassword!",
    }
    bad_res = await async_client.post("/api/v1/auth/login", json=bad_login)
    assert bad_res.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_me(async_client):
    # Register and get token
    reg = {
        "email": "me.test@example.com",
        "password": "Password123!",
        "full_name": "Me Tester",
        "role": "tourist",
        "home_city": "Peshawar",
    }
    reg_res = await async_client.post("/api/v1/auth/register", json=reg)
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]

    # Call /auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = await async_client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    user = me_res.json()
    assert user["email"] == "me.test@example.com"
    assert user["role"] == "tourist"
    assert user["tourist_profile"]["home_city"] == "Peshawar"


@pytest.mark.asyncio
async def test_demo_login_all_roles(async_client):
    for role in ["tourist", "business", "community", "authority"]:
        res = await async_client.post(f"/api/v1/auth/demo-login/{role}")
        assert res.status_code == 200
        data = res.json()
        assert data["user"]["role"] == role
        assert "access_token" in data


@pytest.mark.asyncio
async def test_update_profile_with_new_fields(async_client):
    # 1. Tourist profile update
    res = await async_client.post("/api/v1/auth/demo-login/tourist")
    assert res.status_code == 200
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    update_payload = {
        "full_name": "Updated Tourist Name",
        "language": "ps",
        "emergency_contact_name": "Hamid Khan",
        "emergency_contact_phone": "+923019876543",
        "budget_level": "premium",
        "travel_style": "family",
        "interests": ["Hiking", "Rivers", "Trout Fishing"],
    }
    put_res = await async_client.put("/api/v1/auth/profile", json=update_payload, headers=headers)
    assert put_res.status_code == 200
    updated_user = put_res.json()
    assert updated_user["full_name"] == "Updated Tourist Name"
    assert updated_user["language"] == "ps"
    tp = updated_user["tourist_profile"]
    assert tp["emergency_contact_name"] == "Hamid Khan"
    assert tp["budget_level"] == "premium"
    assert tp["travel_style"] == "family"
    assert "Trout Fishing" in tp["interests"]

    # 2. Business profile update with registration_no
    b_res = await async_client.post("/api/v1/auth/demo-login/business")
    b_token = b_res.json()["access_token"]
    b_headers = {"Authorization": f"Bearer {b_token}"}
    b_payload = {
        "business_name": "Serena Swat Palace",
        "registration_no": "KP-HOTEL-2026-9999",
        "whatsapp_number": "+923001112233",
    }
    b_put = await async_client.put("/api/v1/auth/profile", json=b_payload, headers=b_headers)
    assert b_put.status_code == 200
    b_user = b_put.json()
    assert b_user["business_profile"]["business_name"] == "Serena Swat Palace"
    assert b_user["business_profile"]["registration_no"] == "KP-HOTEL-2026-9999"


@pytest.mark.asyncio
async def test_update_profile_rejects_unknown_fields_with_422(async_client):
    res = await async_client.post("/api/v1/auth/demo-login/tourist")
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to send an unknown/unexpected field
    invalid_payload = {
        "full_name": "Test Name",
        "unexpected_field_123": "injected value",
    }
    bad_res = await async_client.put("/api/v1/auth/profile", json=invalid_payload, headers=headers)
    assert bad_res.status_code == 422
    err_body = bad_res.text
    assert "unexpected_field_123" in err_body


@pytest.mark.asyncio
async def test_theme_and_reduce_effects_saved_and_restored(async_client):
    # 1. Register with theme preference
    payload = {
        "email": "theme.user@example.com",
        "phone": "+923005556677",
        "password": "Password123!",
        "full_name": "Theme Tester",
        "role": "tourist",
        "theme": "lake",
        "reduce_effects": False,
    }
    reg_res = await async_client.post("/api/v1/auth/register", json=payload)
    assert reg_res.status_code == 201
    user_data = reg_res.json()["user"]
    assert user_data["theme"] == "lake"
    assert user_data["reduce_effects"] is False

    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Update to Glass Alpine with reduce_effects
    update_res = await async_client.put("/api/v1/auth/profile", json={
        "theme": "glass",
        "reduce_effects": True,
    }, headers=headers)
    assert update_res.status_code == 200
    updated_user = update_res.json()
    assert updated_user["theme"] == "glass"
    assert updated_user["reduce_effects"] is True

    # 3. Retrieve /me and verify persistence
    me_res = await async_client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_user = me_res.json()
    assert me_user["theme"] == "glass"
    assert me_user["reduce_effects"] is True


