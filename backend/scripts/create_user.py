import argparse
import asyncio
import os
import sys
import uuid

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.modules.accounts.models import (
    User,
    TouristProfile,
    BusinessProfile,
    CommunityProfile,
    AuthorityProfile,
)


async def create_user(
    email: str,
    password: str,
    role: str = "authority",
    full_name: str = "Tourism Staff",
    phone: str = None,
    department: str = "KP Tourism & Culture Department",
    designation: str = "Tourism Officer",
):
    valid_roles = ["authority", "admin", "tourist", "business", "community"]
    if role not in valid_roles:
        print(f"[ERROR] Invalid role '{role}'. Allowed roles: {', '.join(valid_roles)}")
        sys.exit(1)

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if user already exists
        existing = await session.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            print(f"[ERROR] User with email '{email}' already exists.")
            sys.exit(1)

        user = User(
            id=uuid.uuid4(),
            email=email,
            phone=phone or f"+92300{str(uuid.uuid4().int)[:7]}",
            password_hash=get_password_hash(password),
            role=role,
            full_name=full_name,
            language="en",
            status="active",
        )
        session.add(user)
        await session.flush()

        # Add corresponding profile
        if role in ("authority", "admin"):
            profile = AuthorityProfile(
                id=uuid.uuid4(),
                user_id=user.id,
                department=department,
                designation=designation,
                can_verify_businesses=True,
                can_publish_advisories=True,
            )
            session.add(profile)
        elif role == "business":
            profile = BusinessProfile(
                id=uuid.uuid4(),
                owner_id=user.id,
                business_name=f"{full_name}'s Tourism Venture",
                primary_type="hotel",
                contact_phone=user.phone or "+923001234567",
                verification_status="unverified",
            )
            session.add(profile)
        elif role == "community":
            profile = CommunityProfile(
                id=uuid.uuid4(),
                user_id=user.id,
                member_type="resident",
                is_host_approved=False,
            )
            session.add(profile)
        elif role == "tourist":
            profile = TouristProfile(
                id=uuid.uuid4(),
                user_id=user.id,
                nationality="Pakistani",
            )
            session.add(profile)

        await session.commit()
        print(f"[SUCCESS] User created successfully!")
        print(f"  ID:       {user.id}")
        print(f"  Email:    {user.email}")
        print(f"  Role:     {user.role}")
        print(f"  Name:     {user.full_name}")
        if role in ("authority", "admin"):
            print(f"  Dept:     {department}")
            print(f"  Title:    {designation}")


def main():
    parser = argparse.ArgumentParser(description="Create a user account (e.g. Authority staff) for Swat Tourism Platform")
    parser.add_argument("--email", required=True, help="User email address")
    parser.add_argument("--password", required=True, help="User password")
    parser.add_argument("--role", default="authority", help="User role (authority, admin, tourist, business, community)")
    parser.add_argument("--name", default="Tourism Staff", help="Full name")
    parser.add_argument("--phone", default=None, help="Contact phone")
    parser.add_argument("--dept", default="KP Tourism & Culture Department", help="Department for authority staff")
    parser.add_argument("--title", default="Tourism Officer", help="Designation for authority staff")

    args = parser.parse_args()

    asyncio.run(
        create_user(
            email=args.email,
            password=args.password,
            role=args.role.lower(),
            full_name=args.name,
            phone=args.phone,
            department=args.dept,
            designation=args.title,
        )
    )


if __name__ == "__main__":
    main()
