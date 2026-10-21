import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_token_payload, require_roles
from app.modules.accounts.models import BusinessProfile, AuthorityProfile
from app.modules.verification.schemas import (
    VerificationDocumentOut,
    BusinessVerificationStatusOut,
    ApprovalQueueItemOut,
    VerificationDecisionRequest,
    AuditLogOut,
)
from app.modules.verification.service import VerificationService

router = APIRouter(prefix="/verification", tags=["verification"])


async def get_current_business_profile(
    payload: dict = Depends(require_roles(["business", "authority", "admin"])),
    db: AsyncSession = Depends(get_db),
) -> BusinessProfile:
    user_id = uuid.UUID(payload.get("sub"))
    res = await db.execute(select(BusinessProfile).where(BusinessProfile.owner_id == user_id))
    profile = res.scalars().first()
    if not profile and payload.get("role") in ("admin", "authority"):
        stmt = select(BusinessProfile).where(BusinessProfile.business_name == "Swat Serena Hotel")
        profile = (await db.execute(stmt)).scalars().first()
        if not profile:
            profile = (await db.execute(select(BusinessProfile))).scalars().first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found for this account.",
        )
    return profile


async def require_authority_verifier(
    payload: dict = Depends(require_roles(["authority", "admin"])),
    db: AsyncSession = Depends(get_db),
) -> uuid.UUID:
    user_id = uuid.UUID(payload.get("sub"))
    if payload.get("role") == "admin":
        return user_id

    res = await db.execute(select(AuthorityProfile).where(AuthorityProfile.user_id == user_id))
    auth_prof = res.scalar_one_or_none()
    if not auth_prof or not auth_prof.can_verify_businesses:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User lacks permission to verify businesses.",
        )
    return user_id


@router.get("/status")
async def verification_status():
    return {"module": "verification", "status": "active"}


@router.post("/documents", response_model=VerificationDocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    request: Request,
    doc_type: str = Form(..., description="registration, identity_copy, license, gem_certificate, safety_certificate, other"),
    file: UploadFile = File(...),
    profile: BusinessProfile = Depends(get_current_business_profile),
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Business uploads verification document."""
    user_id = uuid.UUID(payload.get("sub"))
    content = await file.read()
    ip = request.client.host if request.client else None
    return await VerificationService.upload_document(
        db=db,
        business_id=profile.id,
        doc_type=doc_type,
        filename=file.filename or "doc.pdf",
        content=content,
        user_id=user_id,
        ip_address=ip,
    )


@router.get("/my-documents", response_model=List[VerificationDocumentOut])
async def get_my_documents(
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """List all documents uploaded by the authenticated business."""
    return await VerificationService.get_business_documents(db, profile.id)


@router.get("/my-status", response_model=BusinessVerificationStatusOut)
async def get_my_verification_status(
    profile: BusinessProfile = Depends(get_current_business_profile),
    db: AsyncSession = Depends(get_db),
):
    """Get verification status, rejection reason, and uploaded documents for current business."""
    return await VerificationService.get_business_status(db, profile.id)


@router.post("/submit", response_model=BusinessVerificationStatusOut)
async def submit_business_verification(
    request: Request,
    profile: BusinessProfile = Depends(get_current_business_profile),
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Business submits their profile and documents for authority verification."""
    user_id = uuid.UUID(payload.get("sub"))
    ip = request.client.host if request.client else None
    return await VerificationService.submit_for_verification(
        db=db,
        business_id=profile.id,
        user_id=user_id,
        ip_address=ip,
    )


@router.get("/approvals", response_model=List[ApprovalQueueItemOut])
async def get_approvals_queue(
    status_filter: Optional[str] = Query(None, description="pending, verified, rejected"),
    _: uuid.UUID = Depends(require_authority_verifier),
    db: AsyncSession = Depends(get_db),
):
    """Authority views queue of businesses requesting verification."""
    return await VerificationService.get_approvals_queue(db, status_filter)


@router.post("/approvals/{business_id}/decide", response_model=BusinessVerificationStatusOut)
async def decide_business_verification(
    business_id: uuid.UUID,
    req: VerificationDecisionRequest,
    request: Request,
    authority_user_id: uuid.UUID = Depends(require_authority_verifier),
    db: AsyncSession = Depends(get_db),
):
    """Authority approves or requests changes/rejects a business."""
    ip = request.client.host if request.client else None
    return await VerificationService.decide_verification(
        db=db,
        business_id=business_id,
        authority_user_id=authority_user_id,
        decision_status=req.status,
        note=req.note,
        ip_address=ip,
    )


@router.get("/audit-logs", response_model=List[AuditLogOut])
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None),
    _: uuid.UUID = Depends(require_authority_verifier),
    db: AsyncSession = Depends(get_db),
):
    """Authority dashboard: Review immutable governance ledger & audit logs."""
    return await VerificationService.get_audit_logs(db, limit=limit, action_filter=action)
