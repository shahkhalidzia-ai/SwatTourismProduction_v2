import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, update, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from fastapi import HTTPException, status

from app.modules.community.models import CommunityPost, IssueReport, HostApplication
from app.modules.community.schemas import (
    CommunityPostCreate,
    CommunityPostUpdate,
    CommunityPostOut,
    IssueReportCreate,
    IssueReportUpdate,
    IssueReportOut,
    HostApplicationCreate,
    HostApplicationReviewRequest,
    HostApplicationOut,
)
from app.modules.accounts.models import User, CommunityProfile
from app.modules.places.models import Area
from app.modules.listings.models import Listing
from app.modules.notifications.service import NotificationService


class CommunityService:
    # -------------------------------------------------------------------------
    # Community Posts
    # -------------------------------------------------------------------------
    @staticmethod
    async def get_published_posts(
        db: AsyncSession,
        post_type: Optional[str] = None,
        area_id: Optional[uuid.UUID] = None,
    ) -> List[CommunityPostOut]:
        query = (
            select(CommunityPost)
            .options(joinedload(CommunityPost.author), joinedload(CommunityPost.area))
            .where(CommunityPost.status == "published")
            .order_by(desc(CommunityPost.created_at))
        )
        if post_type:
            query = query.where(CommunityPost.post_type == post_type)
        if area_id:
            query = query.where(CommunityPost.area_id == area_id)

        result = await db.execute(query)
        posts = result.scalars().all()

        return [
            CommunityPostOut(
                id=p.id,
                author_id=p.author_id,
                author_name=p.author.full_name if p.author else "Local Resident",
                post_type=p.post_type,
                title=p.title,
                body=p.body,
                area_id=p.area_id,
                area_name=p.area.name if p.area else None,
                latitude=float(p.latitude) if p.latitude is not None else None,
                longitude=float(p.longitude) if p.longitude is not None else None,
                event_date=p.event_date,
                status=p.status,
                moderated_by=p.moderated_by,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in posts
        ]

    @staticmethod
    async def get_my_posts(
        db: AsyncSession, author_id: uuid.UUID
    ) -> List[CommunityPostOut]:
        query = (
            select(CommunityPost)
            .options(joinedload(CommunityPost.author), joinedload(CommunityPost.area))
            .where(CommunityPost.author_id == author_id)
            .order_by(desc(CommunityPost.created_at))
        )
        result = await db.execute(query)
        posts = result.scalars().all()

        return [
            CommunityPostOut(
                id=p.id,
                author_id=p.author_id,
                author_name=p.author.full_name if p.author else None,
                post_type=p.post_type,
                title=p.title,
                body=p.body,
                area_id=p.area_id,
                area_name=p.area.name if p.area else None,
                latitude=float(p.latitude) if p.latitude is not None else None,
                longitude=float(p.longitude) if p.longitude is not None else None,
                event_date=p.event_date,
                status=p.status,
                moderated_by=p.moderated_by,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in posts
        ]

    @staticmethod
    async def create_post(
        db: AsyncSession, author_id: uuid.UUID, data: CommunityPostCreate
    ) -> CommunityPostOut:
        # Validate area if provided
        area_name = None
        if data.area_id:
            area_res = await db.execute(select(Area).where(Area.id == data.area_id))
            area = area_res.scalar_one_or_none()
            if area:
                area_name = area.name

        user_res = await db.execute(select(User).where(User.id == author_id))
        user = user_res.scalar_one_or_none()

        post = CommunityPost(
            author_id=author_id,
            post_type=data.post_type,
            title=data.title,
            body=data.body,
            area_id=data.area_id,
            latitude=data.latitude,
            longitude=data.longitude,
            event_date=data.event_date,
            status="published",  # Published directly in prototype
        )
        db.add(post)
        await db.commit()
        await db.refresh(post)

        return CommunityPostOut(
            id=post.id,
            author_id=post.author_id,
            author_name=user.full_name if user else "Local Resident",
            post_type=post.post_type,
            title=post.title,
            body=post.body,
            area_id=post.area_id,
            area_name=area_name,
            latitude=float(post.latitude) if post.latitude is not None else None,
            longitude=float(post.longitude) if post.longitude is not None else None,
            event_date=post.event_date,
            status=post.status,
            moderated_by=post.moderated_by,
            created_at=post.created_at,
            updated_at=post.updated_at,
        )

    # -------------------------------------------------------------------------
    # Issue Reports
    # -------------------------------------------------------------------------
    @staticmethod
    async def create_issue_report(
        db: AsyncSession, reporter_id: uuid.UUID, data: IssueReportCreate
    ) -> IssueReportOut:
        area_name = None
        if data.area_id:
            a_res = await db.execute(select(Area).where(Area.id == data.area_id))
            a = a_res.scalar_one_or_none()
            if a:
                area_name = a.name

        listing_name = None
        if data.listing_id:
            l_res = await db.execute(select(Listing).where(Listing.id == data.listing_id))
            l = l_res.scalar_one_or_none()
            if l:
                listing_name = l.title

        u_res = await db.execute(select(User).where(User.id == reporter_id))
        user = u_res.scalar_one_or_none()

        report = IssueReport(
            reporter_id=reporter_id,
            category=data.category,
            title=data.title,
            description=data.description,
            area_id=data.area_id,
            latitude=data.latitude,
            longitude=data.longitude,
            listing_id=data.listing_id,
            status="new",
        )
        db.add(report)
        await db.commit()
        await db.refresh(report)

        # Notify authority
        auth_users = await db.execute(select(User).where(User.role == "authority"))
        for auth_user in auth_users.scalars().all():
            await NotificationService.create_notification(
                db=db,
                user_id=auth_user.id,
                type="report",
                title=f"New Community Report: {report.title}",
                body=f"Category: {report.category.replace('_', ' ').title()}. Location: {area_name or 'Swat Valley'}.",
                channel="in_app",
                related_type="issue_report",
                related_id=report.id,
            )

        return IssueReportOut(
            id=report.id,
            reporter_id=report.reporter_id,
            reporter_name=user.full_name if user else "Community Member",
            reporter_phone=user.phone if user else None,
            category=report.category,
            title=report.title,
            description=report.description,
            area_id=report.area_id,
            area_name=area_name,
            latitude=float(report.latitude) if report.latitude is not None else None,
            longitude=float(report.longitude) if report.longitude is not None else None,
            listing_id=report.listing_id,
            listing_name=listing_name,
            status=report.status,
            assigned_to=report.assigned_to,
            assignee_name=None,
            resolution_note=report.resolution_note,
            resolved_at=report.resolved_at,
            created_at=report.created_at,
            updated_at=report.updated_at,
        )

    @staticmethod
    async def get_my_reports(
        db: AsyncSession, reporter_id: uuid.UUID
    ) -> List[IssueReportOut]:
        query = (
            select(IssueReport)
            .options(
                joinedload(IssueReport.reporter),
                joinedload(IssueReport.area),
                joinedload(IssueReport.listing),
                joinedload(IssueReport.assignee),
            )
            .where(IssueReport.reporter_id == reporter_id)
            .order_by(desc(IssueReport.created_at))
        )
        result = await db.execute(query)
        reports = result.scalars().all()

        return [
            IssueReportOut(
                id=r.id,
                reporter_id=r.reporter_id,
                reporter_name=r.reporter.full_name if r.reporter else None,
                reporter_phone=r.reporter.phone if r.reporter else None,
                category=r.category,
                title=r.title,
                description=r.description,
                area_id=r.area_id,
                area_name=r.area.name if r.area else None,
                latitude=float(r.latitude) if r.latitude is not None else None,
                longitude=float(r.longitude) if r.longitude is not None else None,
                listing_id=r.listing_id,
                listing_name=r.listing.title if r.listing else None,
                status=r.status,
                assigned_to=r.assigned_to,
                assignee_name=r.assignee.full_name if r.assignee else None,
                resolution_note=r.resolution_note,
                resolved_at=r.resolved_at,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
            for r in reports
        ]

    @staticmethod
    async def get_all_reports(
        db: AsyncSession, status_filter: Optional[str] = None
    ) -> List[IssueReportOut]:
        query = (
            select(IssueReport)
            .options(
                joinedload(IssueReport.reporter),
                joinedload(IssueReport.area),
                joinedload(IssueReport.listing),
                joinedload(IssueReport.assignee),
            )
            .order_by(desc(IssueReport.created_at))
        )
        if status_filter:
            query = query.where(IssueReport.status == status_filter)

        result = await db.execute(query)
        reports = result.scalars().all()

        return [
            IssueReportOut(
                id=r.id,
                reporter_id=r.reporter_id,
                reporter_name=r.reporter.full_name if r.reporter else None,
                reporter_phone=r.reporter.phone if r.reporter else None,
                category=r.category,
                title=r.title,
                description=r.description,
                area_id=r.area_id,
                area_name=r.area.name if r.area else None,
                latitude=float(r.latitude) if r.latitude is not None else None,
                longitude=float(r.longitude) if r.longitude is not None else None,
                listing_id=r.listing_id,
                listing_name=r.listing.title if r.listing else None,
                status=r.status,
                assigned_to=r.assigned_to,
                assignee_name=r.assignee.full_name if r.assignee else None,
                resolution_note=r.resolution_note,
                resolved_at=r.resolved_at,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
            for r in reports
        ]

    @staticmethod
    async def update_report(
        db: AsyncSession,
        report_id: uuid.UUID,
        authority_user_id: uuid.UUID,
        data: IssueReportUpdate,
    ) -> IssueReportOut:
        res = await db.execute(
            select(IssueReport)
            .options(
                joinedload(IssueReport.reporter),
                joinedload(IssueReport.area),
                joinedload(IssueReport.listing),
                joinedload(IssueReport.assignee),
            )
            .where(IssueReport.id == report_id)
        )
        report = res.scalar_one_or_none()
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Issue report not found"
            )

        report.status = data.status
        if data.assigned_to:
            report.assigned_to = data.assigned_to
        elif not report.assigned_to and data.status in ("assigned", "in_progress"):
            report.assigned_to = authority_user_id

        if data.resolution_note is not None:
            report.resolution_note = data.resolution_note

        if data.status in ("resolved", "rejected") and not report.resolved_at:
            report.resolved_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(report)

        # Notify reporter
        await NotificationService.create_notification(
            db=db,
            user_id=report.reporter_id,
            type="report",
            title=f"Report Update: {report.title}",
            body=f"Status changed to {report.status.replace('_', ' ').title()}. {report.resolution_note or ''}",
            channel="in_app",
            related_type="issue_report",
            related_id=report.id,
        )

        return IssueReportOut(
            id=report.id,
            reporter_id=report.reporter_id,
            reporter_name=report.reporter.full_name if report.reporter else None,
            reporter_phone=report.reporter.phone if report.reporter else None,
            category=report.category,
            title=report.title,
            description=report.description,
            area_id=report.area_id,
            area_name=report.area.name if report.area else None,
            latitude=float(report.latitude) if report.latitude is not None else None,
            longitude=float(report.longitude) if report.longitude is not None else None,
            listing_id=report.listing_id,
            listing_name=report.listing.title if report.listing else None,
            status=report.status,
            assigned_to=report.assigned_to,
            assignee_name=report.assignee.full_name if report.assignee else None,
            resolution_note=report.resolution_note,
            resolved_at=report.resolved_at,
            created_at=report.created_at,
            updated_at=report.updated_at,
        )

    # -------------------------------------------------------------------------
    # Host Applications
    # -------------------------------------------------------------------------
    @staticmethod
    async def create_host_application(
        db: AsyncSession, user_id: uuid.UUID, data: HostApplicationCreate
    ) -> HostApplicationOut:
        u_res = await db.execute(select(User).where(User.id == user_id))
        user = u_res.scalar_one_or_none()

        app = HostApplication(
            user_id=user_id,
            offer_type=data.offer_type,
            description=data.description,
            status="pending",
        )
        db.add(app)
        await db.commit()
        await db.refresh(app)

        # Notify authority
        auth_users = await db.execute(select(User).where(User.role == "authority"))
        for auth_user in auth_users.scalars().all():
            await NotificationService.create_notification(
                db=db,
                user_id=auth_user.id,
                type="system",
                title=f"New Host Application: {user.full_name if user else 'Resident'}",
                body=f"Offer: {app.offer_type.title()}. {app.description[:80]}...",
                channel="in_app",
                related_type="host_application",
                related_id=app.id,
            )

        return HostApplicationOut(
            id=app.id,
            user_id=app.user_id,
            applicant_name=user.full_name if user else None,
            applicant_phone=user.phone if user else None,
            applicant_email=user.email if user else None,
            offer_type=app.offer_type,
            description=app.description,
            status=app.status,
            reviewed_by=app.reviewed_by,
            reviewed_at=app.reviewed_at,
            created_at=app.created_at,
            updated_at=app.updated_at,
        )

    @staticmethod
    async def get_my_host_applications(
        db: AsyncSession, user_id: uuid.UUID
    ) -> List[HostApplicationOut]:
        query = (
            select(HostApplication)
            .options(joinedload(HostApplication.user))
            .where(HostApplication.user_id == user_id)
            .order_by(desc(HostApplication.created_at))
        )
        result = await db.execute(query)
        apps = result.scalars().all()

        return [
            HostApplicationOut(
                id=a.id,
                user_id=a.user_id,
                applicant_name=a.user.full_name if a.user else None,
                applicant_phone=a.user.phone if a.user else None,
                applicant_email=a.user.email if a.user else None,
                offer_type=a.offer_type,
                description=a.description,
                status=a.status,
                reviewed_by=a.reviewed_by,
                reviewed_at=a.reviewed_at,
                created_at=a.created_at,
                updated_at=a.updated_at,
            )
            for a in apps
        ]

    @staticmethod
    async def get_all_host_applications(
        db: AsyncSession, status_filter: Optional[str] = None, offer_type: Optional[str] = None
    ) -> List[HostApplicationOut]:
        query = (
            select(HostApplication)
            .options(joinedload(HostApplication.user))
            .order_by(desc(HostApplication.created_at))
        )
        if status_filter:
            query = query.where(HostApplication.status == status_filter)
        if offer_type:
            query = query.where(HostApplication.offer_type == offer_type)

        result = await db.execute(query)
        apps = result.scalars().all()

        return [
            HostApplicationOut(
                id=a.id,
                user_id=a.user_id,
                applicant_name=a.user.full_name if a.user else None,
                applicant_phone=a.user.phone if a.user else None,
                applicant_email=a.user.email if a.user else None,
                offer_type=a.offer_type,
                description=a.description,
                status=a.status,
                reviewed_by=a.reviewed_by,
                reviewed_at=a.reviewed_at,
                created_at=a.created_at,
                updated_at=a.updated_at,
            )
            for a in apps
        ]

    @staticmethod
    async def review_host_application(
        db: AsyncSession,
        app_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        data: HostApplicationReviewRequest,
    ) -> HostApplicationOut:
        res = await db.execute(
            select(HostApplication)
            .options(joinedload(HostApplication.user))
            .where(HostApplication.id == app_id)
        )
        app = res.scalar_one_or_none()
        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Host application not found",
            )

        app.status = data.status
        app.reviewed_by = reviewer_id
        app.reviewed_at = datetime.now(timezone.utc)

        # Sync approval flag on community member's profile
        prof_res = await db.execute(
            select(CommunityProfile).where(CommunityProfile.user_id == app.user_id)
        )
        comm_prof = prof_res.scalar_one_or_none()
        if comm_prof:
            if data.status == "approved":
                comm_prof.is_host_approved = True
            elif data.status == "rejected":
                comm_prof.is_host_approved = False

        await db.commit()
        await db.refresh(app)

        # Notify applicant
        await NotificationService.create_notification(
            db=db,
            user_id=app.user_id,
            type="system",
            title=f"Host Application {data.status.title()}",
            body=f"Your host application ({app.offer_type.title()}) has been {data.status}.",
            channel="in_app",
            related_type="host_application",
            related_id=app.id,
        )

        return HostApplicationOut(
            id=app.id,
            user_id=app.user_id,
            applicant_name=app.user.full_name if app.user else None,
            applicant_phone=app.user.phone if app.user else None,
            applicant_email=app.user.email if app.user else None,
            offer_type=app.offer_type,
            description=app.description,
            status=app.status,
            reviewed_by=app.reviewed_by,
            reviewed_at=app.reviewed_at,
            created_at=app.created_at,
            updated_at=app.updated_at,
        )

    @staticmethod
    async def delete_host_application(
        db: AsyncSession, app_id: uuid.UUID, user_id: uuid.UUID, is_admin: bool = False
    ) -> bool:
        stmt = select(HostApplication).where(HostApplication.id == app_id)
        res = await db.execute(stmt)
        app = res.scalar_one_or_none()
        if not app:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Host application not found")
        if not is_admin and app.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot delete another member's service")
        await db.delete(app)
        await db.commit()
        return True
