import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token
from app.core.deps import get_current_token_payload
from app.modules.accounts.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UpdateProfileRequest,
    UserOut,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    SendPhoneOTPRequest,
    VerifyPhoneOTPRequest,
    AuthMessageResponse,
)
from app.modules.accounts.service import AccountService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/status")
async def auth_status():
    return {"module": "accounts", "status": "active"}


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await AccountService.register(db, req)
    user_out = AccountService.user_to_user_out(user)
    
    access_token = create_access_token(subject=str(user.id), role=user.role)
    refresh_token = create_refresh_token(subject=str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user_out,
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await AccountService.authenticate(db, req)
    user_out = AccountService.user_to_user_out(user)

    access_token = create_access_token(subject=str(user.id), role=user.role)
    refresh_token = create_refresh_token(subject=str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user_out,
    )


@router.post("/refresh")
async def refresh_token_endpoint(req: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(req.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid token type")
        
        user_id = payload.get("sub")
        user = await AccountService.get_user_by_id(db, uuid.UUID(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Refresh token rotation: issue new access token AND new refresh token
        new_access = create_access_token(subject=str(user.id), role=user.role)
        new_refresh = create_refresh_token(subject=str(user.id))
        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer"
        }
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.post("/forgot-password")
async def forgot_password_endpoint(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    return await AccountService.request_password_reset(db, req)


@router.post("/reset-password")
async def reset_password_endpoint(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    return await AccountService.reset_password(db, req)


@router.post("/phone-otp/send")
async def send_phone_otp_endpoint(req: SendPhoneOTPRequest, db: AsyncSession = Depends(get_db)):
    return await AccountService.send_phone_otp(db, req)


@router.post("/phone-otp/verify")
async def verify_phone_otp_endpoint(req: VerifyPhoneOTPRequest, db: AsyncSession = Depends(get_db)):
    return await AccountService.verify_phone_otp(db, req)


@router.get("/me", response_model=UserOut)
async def get_current_user_profile(
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    user_id = payload.get("sub")
    user = await AccountService.get_user_by_id(db, uuid.UUID(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return AccountService.user_to_user_out(user)


@router.put("/profile", response_model=UserOut)
@router.patch("/profile", response_model=UserOut)
async def update_profile(
    req: UpdateProfileRequest,
    payload: dict = Depends(get_current_token_payload),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(payload.get("sub"))
    user = await AccountService.update_profile(db, user_id, req)
    return AccountService.user_to_user_out(user)


@router.post("/demo-login/{role}", response_model=TokenResponse)
async def demo_login(role: str, db: AsyncSession = Depends(get_db)):
    """Fast login/seed helper for one-click switching in prototype demo."""
    demo_specs = {
        "tourist": {
            "email": "tourist@swattourism.pk",
            "full_name": "Sara Ahmed",
            "phone": "+923009990001",
            "home_city": "Islamabad",
            "nationality": "Pakistani",
            "emergency_contact_name": "Tariq Ahmed",
            "emergency_contact_phone": "+923009988776",
        },
        "business": {
            "email": "hotel@swattourism.pk",
            "full_name": "Swat Serena Hotel Manager",
            "phone": "+923009990002",
            "business_name": "Swat Serena Hotel",
            "primary_type": "hotel",
            "contact_phone": "+92-946-710201",
            "whatsapp_number": "+92-946-710201",
        },
        "hotel": {
            "email": "hotel@swattourism.pk",
            "full_name": "Swat Serena Hotel Manager",
            "phone": "+923009990002",
            "business_name": "Swat Serena Hotel",
            "primary_type": "hotel",
            "contact_phone": "+92-946-710201",
            "whatsapp_number": "+92-946-710201",
        },
        "serena": {
            "email": "hotel@swattourism.pk",
            "full_name": "Swat Serena Hotel Manager",
            "phone": "+923009990002",
            "business_name": "Swat Serena Hotel",
            "primary_type": "hotel",
            "contact_phone": "+92-946-710201",
            "whatsapp_number": "+92-946-710201",
        },
        "community": {
            "email": "community@swattourism.pk",
            "full_name": "Gul Zaman",
            "phone": "+923009990003",
            "member_type": "resident",
            "bio": "Lifelong resident of Ushu Valley, sharing local mountain paths.",
        },
        "transport": {
            "email": "transport@swattourism.pk",
            "full_name": "Swat Mountain Transport Operator",
            "phone": "+923009990006",
            "business_name": "Swat 4x4 Mountain Rides",
            "primary_type": "transport",
            "contact_phone": "+92-300-8881122",
            "whatsapp_number": "+92-300-8881122",
        },
        "restaurant": {
            "email": "restaurant@swattourism.pk",
            "full_name": "The Hujra Cafe Manager",
            "phone": "+923009990007",
            "business_name": "The Hujra Cafe & Restaurant",
            "primary_type": "restaurant",
            "contact_phone": "+92-300-7773344",
            "whatsapp_number": "+92-300-7773344",
        },
        "authority": {
            "email": "authority@swattourism.pk",
            "full_name": "District Tourism Officer",
            "phone": "+923009990004",
            "department": "Swat District Tourism Authority",
            "designation": "Chief District Officer",
        },
        "admin": {
            "email": "admin@swattourism.pk",
            "full_name": "Super Admin Demo Master",
            "phone": "+923009990005",
        },
        "demo": {
            "email": "demo@swattourism.pk",
            "full_name": "Demo Master Walker",
            "phone": "+923009990008",
        },
    }

    if role not in demo_specs:
        raise HTTPException(
            status_code=400,
            detail="Invalid demo role. Allowed: tourist, business, hotel, transport, restaurant, community, authority, admin, demo, serena",
        )

    spec = demo_specs[role]
    target_role = "business" if role in ("serena", "hotel", "transport", "restaurant") else ("admin" if role == "demo" else role)
    user = await AccountService.get_user_by_identifier(db, spec["email"])

    if not user:
        # Register on first demand
        reg_req = RegisterRequest(
            email=spec["email"],
            phone=spec["phone"],
            password="DemoPassword123!",
            full_name=spec["full_name"],
            role=target_role,  # type: ignore
            **{k: v for k, v in spec.items() if k not in ("email", "phone", "full_name")}
        )
        user = await AccountService.register(db, reg_req)

    user_out = AccountService.user_to_user_out(user)
    access_token = create_access_token(subject=str(user.id), role=user.role)
    refresh_token = create_refresh_token(subject=str(user.id))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user_out,
    )


@router.get("/admin/users", response_model=list[UserOut])
async def get_all_users_for_admin(
    db: AsyncSession = Depends(get_db),
):
    users = await AccountService.get_all_users(db)
    return [AccountService.user_to_user_out(u) for u in users]


@router.patch("/admin/users/{user_id}/status", response_model=UserOut)
async def update_user_status_endpoint(
    user_id: uuid.UUID,
    status_data: dict,
    db: AsyncSession = Depends(get_db),
):
    target_status = status_data.get("status", "active")
    user = await AccountService.update_user_status(db, user_id, target_status)
    return AccountService.user_to_user_out(user)


@router.post("/admin/reset-data")
async def reset_data_endpoint():
    from scripts.reset_empty import reset_empty
    await reset_empty(force=True)
    return {"message": "All database and transactional data successfully cleared to fresh empty state."}

