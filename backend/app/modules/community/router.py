import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_token_payload, require_roles
from app.modules.community.schemas import (
    CommunityPostCreate,
    CommunityPostOut,
    IssueReportCreate,
    IssueReportUpdate,
    IssueReportOut,
    HostApplicationCreate,
    HostApplicationReviewRequest,
    HostApplicationOut,
)
from app.modules.community.service import CommunityService

router = APIRouter(prefix="/community", tags=["community"])


@router.get("/status")
async def community_status():
    return {"module": "community", "status": "active"}


# =============================================================================
# COMMUNITY POSTS (Stories, Hidden Spots, Events, Tips)
# =============================================================================

@router.get("/posts", response_model=List[CommunityPostOut])
async def list_published_posts(
    post_type: Optional[str] = Query(None),
    area_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Public feed of published community stories, hidden spots, and local tips."""
    return await CommunityService.get_published_posts(db, post_type, area_id)


@router.get("/posts/my", response_model=List[CommunityPostOut])
async def list_my_posts(
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve posts authored by the currently logged-in user."""
    user_id = uuid.UUID(payload.get("sub"))
    return await CommunityService.get_my_posts(db, user_id)


@router.post("/posts", response_model=CommunityPostOut, status_code=status.HTTP_201_CREATED)
async def create_post(
    data: CommunityPostCreate,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Authenticated user (community member or tourist) submits a story or hidden spot."""
    user_id = uuid.UUID(payload.get("sub"))
    return await CommunityService.create_post(db, user_id, data)


# =============================================================================
# ISSUE REPORTS (Road Hazards, Litter, Overcharging Complaints)
# =============================================================================

@router.post("/reports", response_model=IssueReportOut, status_code=status.HTTP_201_CREATED)
async def submit_issue_report(
    data: IssueReportCreate,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Submit a road blockage, waste accumulation, or tourist service complaint."""
    reporter_id = uuid.UUID(payload.get("sub"))
    return await CommunityService.create_issue_report(db, reporter_id, data)


@router.get("/reports/my", response_model=List[IssueReportOut])
async def list_my_reports(
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """List all reports submitted by the current user with live status updates."""
    user_id = uuid.UUID(payload.get("sub"))
    return await CommunityService.get_my_reports(db, user_id)


@router.get("/reports/all", response_model=List[IssueReportOut])
async def list_all_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    payload: dict = Depends(require_roles(["authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Authority dashboard: List all incoming community and tourist reports."""
    return await CommunityService.get_all_reports(db, status_filter)


@router.patch("/reports/{report_id}", response_model=IssueReportOut)
async def update_report_status(
    report_id: uuid.UUID,
    data: IssueReportUpdate,
    payload: dict = Depends(require_roles(["authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Authority assigns or resolves an issue report with resolution notes."""
    authority_id = uuid.UUID(payload.get("sub"))
    return await CommunityService.update_report(db, report_id, authority_id, data)


# =============================================================================
# HOST APPLICATIONS (Homestays, Local Guides, Crafts)
# =============================================================================

@router.post("/hosts/apply", response_model=HostApplicationOut, status_code=status.HTTP_201_CREATED)
async def apply_to_host(
    data: HostApplicationCreate,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Community member applies to become a verified local host, guide, or craft seller."""
    user_id = uuid.UUID(payload.get("sub"))
    return await CommunityService.create_host_application(db, user_id, data)


@router.get("/hosts/my", response_model=List[HostApplicationOut])
async def list_my_host_applications(
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Community member checks their host application status."""
    user_id = uuid.UUID(payload.get("sub"))
    return await CommunityService.get_my_host_applications(db, user_id)


@router.get("/hosts/all", response_model=List[HostApplicationOut])
async def list_all_host_applications(
    status_filter: Optional[str] = Query(None, alias="status"),
    payload: dict = Depends(require_roles(["authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Authority dashboard: View all incoming community host applications."""
    return await CommunityService.get_all_host_applications(db, status_filter)


@router.get("/hosts/approved", response_model=List[HostApplicationOut])
async def list_approved_host_services(
    offer_type: Optional[str] = Query(None, alias="type"),
    db: AsyncSession = Depends(get_db),
):
    """Public / Tourist endpoint: List all authority-verified and approved community services (rides, guides, activities, crafts, homestays)."""
    return await CommunityService.get_all_host_applications(db, status_filter="approved", offer_type=offer_type)


@router.post("/hosts/{app_id}/review", response_model=HostApplicationOut)
async def review_host_application(
    app_id: uuid.UUID,
    data: HostApplicationReviewRequest,
    payload: dict = Depends(require_roles(["authority", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Authority reviews and approves or rejects a community host application."""
    reviewer_id = uuid.UUID(payload.get("sub"))
    return await CommunityService.review_host_application(db, app_id, reviewer_id, data)


@router.delete("/hosts/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_host_application(
    app_id: uuid.UUID,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Community member or authority removes a host application / local service offering."""
    user_id = uuid.UUID(payload.get("sub"))
    roles = payload.get("roles", [])
    is_admin = any(r in roles for r in ["authority", "admin"])
    await CommunityService.delete_host_application(db, app_id, user_id, is_admin)
    return None

