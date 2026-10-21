import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_community_posts_workflow(async_client: AsyncClient):
    # 1. Register community member
    comm_resp = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "gul_zaman@swat.pk",
            "password": "Password123!",
            "full_name": "Gul Zaman",
            "phone": "+923001239999",
            "role": "community",
        },
    )
    assert comm_resp.status_code == 201
    comm_token = comm_resp.json()["access_token"]
    comm_headers = {"Authorization": f"Bearer {comm_token}"}

    # 2. Community member creates a hidden spot post
    post_payload = {
        "post_type": "hidden_spot",
        "title": "Secret Waterfall in Utror Valley",
        "body": "A 30-minute hike past the wooden bridge leads to this crystal clear cascade untouched by crowds.",
        "latitude": 35.5012,
        "longitude": 72.4821,
    }
    create_resp = await async_client.post(
        "/api/v1/community/posts", headers=comm_headers, json=post_payload
    )
    assert create_resp.status_code == 201
    post_data = create_resp.json()
    assert post_data["title"] == "Secret Waterfall in Utror Valley"
    assert post_data["post_type"] == "hidden_spot"
    assert post_data["status"] == "published"
    post_id = post_data["id"]

    # 3. Public lists published posts
    list_resp = await async_client.get("/api/v1/community/posts")
    assert list_resp.status_code == 200
    posts = list_resp.json()
    assert len(posts) >= 1
    assert any(p["id"] == post_id for p in posts)

    # 4. Filter by post_type
    filter_resp = await async_client.get(
        "/api/v1/community/posts?post_type=hidden_spot"
    )
    assert filter_resp.status_code == 200
    filtered_posts = filter_resp.json()
    assert all(p["post_type"] == "hidden_spot" for p in filtered_posts)

    # 5. Community member checks their own posts
    my_posts_resp = await async_client.get(
        "/api/v1/community/posts/my", headers=comm_headers
    )
    assert my_posts_resp.status_code == 200
    my_posts = my_posts_resp.json()
    assert any(p["id"] == post_id for p in my_posts)


@pytest.mark.asyncio
async def test_issue_reports_workflow(async_client: AsyncClient):
    # 1. Setup authority and tourist
    auth_resp = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "reports_officer@swat.gov",
            "password": "Password123!",
            "full_name": "Reports Officer",
            "phone": "+923001238888",
            "role": "authority",
        },
    )
    auth_token = auth_resp.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {auth_token}"}

    tourist_resp = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "concerned_tourist@swat.com",
            "password": "Password123!",
            "full_name": "Concerned Tourist",
            "phone": "+923001237777",
            "role": "tourist",
        },
    )
    tourist_token = tourist_resp.json()["access_token"]
    tourist_headers = {"Authorization": f"Bearer {tourist_token}"}

    # 2. Tourist creates issue report
    report_payload = {
        "category": "road_blocked",
        "title": "Landslide block near Bahrain Bridge",
        "description": "Heavy rocks fell onto the main N-95 bypass blocking one lane. Traffic backed up.",
        "latitude": 35.2051,
        "longitude": 72.5521,
    }
    report_resp = await async_client.post(
        "/api/v1/community/reports", headers=tourist_headers, json=report_payload
    )
    assert report_resp.status_code == 201
    report_data = report_resp.json()
    assert report_data["status"] == "new"
    report_id = report_data["id"]

    # 3. Tourist queries their own reports
    my_rep_resp = await async_client.get(
        "/api/v1/community/reports/my", headers=tourist_headers
    )
    assert my_rep_resp.status_code == 200
    my_reports = my_rep_resp.json()
    assert any(r["id"] == report_id for r in my_reports)

    # 4. Tourist cannot access authority queue (Forbidden)
    forbidden_resp = await async_client.get(
        "/api/v1/community/reports/all", headers=tourist_headers
    )
    assert forbidden_resp.status_code == 403

    # 5. Authority lists reports
    all_rep_resp = await async_client.get(
        "/api/v1/community/reports/all", headers=auth_headers
    )
    assert all_rep_resp.status_code == 200
    all_reports = all_rep_resp.json()
    assert any(r["id"] == report_id for r in all_reports)

    # 6. Authority assigns and resolves report
    resolve_resp = await async_client.patch(
        f"/api/v1/community/reports/{report_id}",
        headers=auth_headers,
        json={
            "status": "resolved",
            "resolution_note": "District machinery cleared rockfall. Normal two-way traffic restored.",
        },
    )
    assert resolve_resp.status_code == 200
    updated_report = resolve_resp.json()
    assert updated_report["status"] == "resolved"
    assert updated_report["resolution_note"] is not None
    assert updated_report["resolved_at"] is not None


@pytest.mark.asyncio
async def test_host_applications_workflow(async_client: AsyncClient):
    # 1. Setup authority and community applicant
    auth_resp = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "host_reviewer@swat.gov",
            "password": "Password123!",
            "full_name": "Host Program Reviewer",
            "phone": "+923001236666",
            "role": "authority",
        },
    )
    auth_token = auth_resp.json()["access_token"]
    auth_headers = {"Authorization": f"Bearer {auth_token}"}

    comm_resp = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "host_applicant@swat.pk",
            "password": "Password123!",
            "full_name": "Ahmad Jan",
            "phone": "+923001235555",
            "role": "community",
        },
    )
    comm_token = comm_resp.json()["access_token"]
    comm_headers = {"Authorization": f"Bearer {comm_token}"}

    # 2. Community member applies to become a homestay host
    apply_payload = {
        "offer_type": "homestay",
        "description": "Traditional 3-room stone house in Kalam Valley. Can host families with homemade Swati meals.",
    }
    apply_resp = await async_client.post(
        "/api/v1/community/hosts/apply", headers=comm_headers, json=apply_payload
    )
    assert apply_resp.status_code == 201
    app_data = apply_resp.json()
    assert app_data["status"] == "pending"
    app_id = app_data["id"]

    # 3. Community member checks my applications
    my_apps_resp = await async_client.get(
        "/api/v1/community/hosts/my", headers=comm_headers
    )
    assert my_apps_resp.status_code == 200
    my_apps = my_apps_resp.json()
    assert any(a["id"] == app_id for a in my_apps)

    # 4. Authority lists applications
    all_apps_resp = await async_client.get(
        "/api/v1/community/hosts/all", headers=auth_headers
    )
    assert all_apps_resp.status_code == 200
    all_apps = all_apps_resp.json()
    assert any(a["id"] == app_id for a in all_apps)

    # 5. Authority approves application
    review_resp = await async_client.post(
        f"/api/v1/community/hosts/{app_id}/review",
        headers=auth_headers,
        json={"status": "approved", "review_notes": "Premises and contact verified."},
    )
    assert review_resp.status_code == 200
    reviewed_app = review_resp.json()
    assert reviewed_app["status"] == "approved"
    assert reviewed_app["reviewed_at"] is not None

    # 6. Verify community profile is now marked as an approved host
    me_resp = await async_client.get("/api/v1/auth/me", headers=comm_headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["community_profile"] is not None
    assert me_data["community_profile"]["is_host_approved"] is True

    # 7. Test rejection workflow: second applicant is rejected
    comm2_resp = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "host_rejected@swat.pk",
            "password": "Password123!",
            "full_name": "Rejected Applicant",
            "phone": "+923001234444",
            "role": "community",
        },
    )
    comm2_token = comm2_resp.json()["access_token"]
    comm2_headers = {"Authorization": f"Bearer {comm2_token}"}
    apply2_resp = await async_client.post(
        "/api/v1/community/hosts/apply",
        headers=comm2_headers,
        json={"offer_type": "homestay", "description": "Insufficient space but applying anyway for test."},
    )
    app2_id = apply2_resp.json()["id"]

    rej_resp = await async_client.post(
        f"/api/v1/community/hosts/{app2_id}/review",
        headers=auth_headers,
        json={"status": "rejected", "review_notes": "Standards not met."},
    )
    assert rej_resp.status_code == 200
    me2_resp = await async_client.get("/api/v1/auth/me", headers=comm2_headers)
    assert me2_resp.json()["community_profile"]["is_host_approved"] is False
