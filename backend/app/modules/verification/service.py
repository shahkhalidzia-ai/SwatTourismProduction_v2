import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.core.config import settings
from app.modules.accounts.models import BusinessProfile, User
from app.modules.listings.models import Listing
from app.modules.verification.models import VerificationDocument, AuditLog
from app.modules.verification.schemas import (
    VerificationDocumentOut,
    BusinessVerificationStatusOut,
    ApprovalQueueItemOut,
    AuditLogOut,
)


class VerificationService:
    @staticmethod
    async def record_audit_log(
        db: AsyncSession,
        user_id: Optional[uuid.UUID],
        action: str,
        entity_type: str,
        entity_id: Optional[uuid.UUID],
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
        )
        db.add(log)
        await db.flush()
        return log

    @classmethod
    async def upload_document(
        cls,
        db: AsyncSession,
        business_id: uuid.UUID,
        doc_type: str,
        filename: str,
        content: bytes,
        user_id: uuid.UUID,
        ip_address: Optional[str] = None,
    ) -> VerificationDocumentOut:
        allowed_types = {'registration', 'identity_copy', 'license', 'gem_certificate', 'safety_certificate', 'other'}
        if doc_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid document type. Allowed types: {', '.join(sorted(allowed_types))}",
            )

        # Store on disk
        folder = os.path.join(settings.UPLOAD_DIR, "documents")
        os.makedirs(folder, exist_ok=True)
        ext = os.path.splitext(filename)[1].lower() or ".pdf"
        unique_name = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join(folder, unique_name)
        with open(filepath, "wb") as f:
            f.write(content)

        relative_url = f"/uploads/documents/{unique_name}"
        doc = VerificationDocument(
            business_id=business_id,
            doc_type=doc_type,
            file_url=relative_url,
            status="pending",
        )
        db.add(doc)
        await db.flush()

        await cls.record_audit_log(
            db,
            user_id=user_id,
            action="document.upload",
            entity_type="verification_documents",
            entity_id=doc.id,
            new_values={"doc_type": doc_type, "file_url": relative_url},
            ip_address=ip_address,
        )

        await db.commit()
        await db.refresh(doc)
        return VerificationDocumentOut.model_validate(doc)

    @staticmethod
    async def get_business_documents(db: AsyncSession, business_id: uuid.UUID) -> List[VerificationDocumentOut]:
        result = await db.execute(
            select(VerificationDocument)
            .where(VerificationDocument.business_id == business_id)
            .order_by(VerificationDocument.created_at.desc())
        )
        docs = result.scalars().all()
        return [VerificationDocumentOut.model_validate(d) for d in docs]

    @classmethod
    async def submit_for_verification(
        cls,
        db: AsyncSession,
        business_id: uuid.UUID,
        user_id: uuid.UUID,
        ip_address: Optional[str] = None,
    ) -> BusinessVerificationStatusOut:
        result = await db.execute(select(BusinessProfile).where(BusinessProfile.id == business_id))
        biz = result.scalar_one_or_none()
        if not biz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business profile not found.")

        old_status = biz.verification_status
        biz.verification_status = "pending"
        biz.rejection_reason = None

        await cls.record_audit_log(
            db,
            user_id=user_id,
            action="business.submit_verification",
            entity_type="business_profiles",
            entity_id=biz.id,
            old_values={"verification_status": old_status},
            new_values={"verification_status": "pending"},
            ip_address=ip_address,
        )

        await db.commit()
        return await cls.get_business_status(db, business_id)

    @classmethod
    async def get_business_status(cls, db: AsyncSession, business_id: uuid.UUID) -> BusinessVerificationStatusOut:
        stmt = (
            select(BusinessProfile)
            .options(selectinload(BusinessProfile.verified_by_user))
            .where(BusinessProfile.id == business_id)
        )
        res = await db.execute(stmt)
        biz = res.scalar_one_or_none()
        if not biz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found.")

        docs = await cls.get_business_documents(db, business_id)
        verified_by_name = biz.verified_by_user.full_name if getattr(biz, "verified_by_user", None) else None

        return BusinessVerificationStatusOut(
            business_id=biz.id,
            business_name=biz.business_name,
            verification_status=biz.verification_status,
            registration_no=biz.registration_no,
            rejection_reason=biz.rejection_reason,
            verified_at=biz.verified_at,
            verified_by_name=verified_by_name,
            documents=docs,
        )

    @classmethod
    async def get_approvals_queue(
        cls,
        db: AsyncSession,
        status_filter: Optional[str] = None,
    ) -> List[ApprovalQueueItemOut]:
        stmt = (
            select(BusinessProfile)
            .options(selectinload(BusinessProfile.owner))
            .order_by(BusinessProfile.created_at.desc())
        )
        if status_filter:
            stmt = stmt.where(BusinessProfile.verification_status == status_filter)

        res = await db.execute(stmt)
        businesses = res.scalars().all()

        queue = []
        for b in businesses:
            docs = await cls.get_business_documents(db, b.id)

            # Count pending listings for this business
            pending_count_res = await db.execute(
                select(func.count(Listing.id)).where(
                    and_(Listing.business_id == b.id, Listing.status == "pending")
                )
            )
            pending_count = pending_count_res.scalar() or 0

            queue.append(
                ApprovalQueueItemOut(
                    business_id=b.id,
                    business_name=b.business_name,
                    primary_type=b.primary_type,
                    registration_no=b.registration_no,
                    contact_phone=b.contact_phone,
                    whatsapp_number=b.whatsapp_number,
                    address_text=b.address_text,
                    owner_name=b.owner.full_name if b.owner else "Unknown",
                    owner_email=b.owner.email if b.owner else None,
                    verification_status=b.verification_status,
                    rejection_reason=b.rejection_reason,
                    documents=docs,
                    pending_listings_count=pending_count,
                    submitted_at=b.updated_at or b.created_at,
                )
            )
        return queue

    @classmethod
    async def decide_verification(
        cls,
        db: AsyncSession,
        business_id: uuid.UUID,
        authority_user_id: uuid.UUID,
        decision_status: str,
        note: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> BusinessVerificationStatusOut:
        result = await db.execute(select(BusinessProfile).where(BusinessProfile.id == business_id))
        biz = result.scalar_one_or_none()
        if not biz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found.")

        old_status = biz.verification_status

        if decision_status == "approved":
            biz.verification_status = "verified"
            biz.verified_by = authority_user_id
            biz.verified_at = datetime.now(timezone.utc)
            biz.rejection_reason = None

            # Approve all pending documents for this business
            doc_res = await db.execute(
                select(VerificationDocument).where(
                    and_(VerificationDocument.business_id == biz.id, VerificationDocument.status == "pending")
                )
            )
            for d in doc_res.scalars().all():
                d.status = "approved"
                d.reviewed_by = authority_user_id
                d.reviewed_at = datetime.now(timezone.utc)
                d.note = note

            # Rule 2 (Verification Gate): Turn all pending and draft listings of this business to 'published'
            listings_res = await db.execute(
                select(Listing).where(and_(Listing.business_id == biz.id, Listing.status.in_(["pending", "draft"])))
            )
            for l in listings_res.scalars().all():
                l.status = "published"
                l.is_verified = True

            await cls.record_audit_log(
                db,
                user_id=authority_user_id,
                action="business.verify",
                entity_type="business_profiles",
                entity_id=biz.id,
                old_values={"verification_status": old_status},
                new_values={"verification_status": "verified", "note": note},
                ip_address=ip_address,
            )

        elif decision_status == "rejected":
            biz.verification_status = "rejected"
            biz.rejection_reason = note or "Document requirements not met. Please re-upload valid government credentials."

            # Mark pending documents as rejected
            doc_res = await db.execute(
                select(VerificationDocument).where(
                    and_(VerificationDocument.business_id == biz.id, VerificationDocument.status == "pending")
                )
            )
            for d in doc_res.scalars().all():
                d.status = "rejected"
                d.reviewed_by = authority_user_id
                d.reviewed_at = datetime.now(timezone.utc)
                d.note = note

            await cls.record_audit_log(
                db,
                user_id=authority_user_id,
                action="business.reject",
                entity_type="business_profiles",
                entity_id=biz.id,
                old_values={"verification_status": old_status},
                new_values={"verification_status": "rejected", "rejection_reason": biz.rejection_reason},
                ip_address=ip_address,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown decision status: '{decision_status}'. Must be 'approved' or 'rejected'.",
            )

        await db.commit()
        return await cls.get_business_status(db, business_id)

    @classmethod
    async def get_audit_logs(
        cls,
        db: AsyncSession,
        limit: int = 50,
        action_filter: Optional[str] = None
    ) -> List[AuditLog]:
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        if action_filter:
            stmt = stmt.where(AuditLog.action.ilike(f"%{action_filter}%"))
        res = await db.execute(stmt)
        return res.scalars().all()
