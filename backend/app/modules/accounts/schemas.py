import uuid
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator


RoleType = Literal["tourist", "business", "community", "authority", "admin"]
PrimaryBusinessType = Literal["hotel", "restaurant", "transport", "guide", "activity", "shop"]
CommunityMemberType = Literal["resident", "host", "artisan"]


# Profile Schemas
class TouristProfileSchema(BaseModel):
    id: uuid.UUID
    home_city: Optional[str] = None
    nationality: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    budget_level: Optional[str] = None
    travel_style: Optional[str] = None
    interests: Optional[list[str]] = None

    model_config = ConfigDict(from_attributes=True)


class BusinessProfileSchema(BaseModel):
    id: uuid.UUID
    business_name: str
    primary_type: PrimaryBusinessType
    registration_no: Optional[str] = None
    contact_phone: str
    whatsapp_number: Optional[str] = None
    address_text: Optional[str] = None
    area_id: Optional[uuid.UUID] = None
    verification_status: str
    rejection_reason: Optional[str] = None
    accommodation_type: Optional[str] = "Hotel"

    model_config = ConfigDict(from_attributes=True)


class CommunityProfileSchema(BaseModel):
    id: uuid.UUID
    area_id: Optional[uuid.UUID] = None
    member_type: CommunityMemberType
    bio: Optional[str] = None
    is_host_approved: bool

    model_config = ConfigDict(from_attributes=True)


class AuthorityProfileSchema(BaseModel):
    id: uuid.UUID
    department: str
    designation: Optional[str] = None
    area_id: Optional[uuid.UUID] = None
    can_verify_businesses: bool
    can_publish_advisories: bool

    model_config = ConfigDict(from_attributes=True)


# User Output Schema
class UserOut(BaseModel):
    id: uuid.UUID
    email: Optional[str] = None
    phone: Optional[str] = None
    role: RoleType
    full_name: str
    language: str
    avatar_url: Optional[str] = None
    status: str
    theme: Literal["lake", "glass"] = "lake"
    reduce_effects: bool = False
    created_at: datetime
    
    # Profile details
    tourist_profile: Optional[TouristProfileSchema] = None
    business_profile: Optional[BusinessProfileSchema] = None
    community_profile: Optional[CommunityProfileSchema] = None
    authority_profile: Optional[AuthorityProfileSchema] = None

    model_config = ConfigDict(from_attributes=True)


# Auth Schemas
class RegisterRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    role: RoleType = "tourist"
    theme: Optional[Literal["lake", "glass"]] = "lake"
    reduce_effects: Optional[bool] = False

    # Optional role profile fields
    # Tourist
    home_city: Optional[str] = None
    nationality: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    budget_level: Optional[Literal["budget", "mid_range", "premium"]] = None
    travel_style: Optional[Literal["solo", "couple", "family", "friends", "group"]] = None
    interests: Optional[list[str]] = None
    # Business
    business_name: Optional[str] = None
    primary_type: Optional[PrimaryBusinessType] = "hotel"
    accommodation_type: Optional[str] = "Hotel"
    contact_phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    registration_no: Optional[str] = None
    area_id: Optional[uuid.UUID] = None
    address_text: Optional[str] = None
    # Community
    member_type: Optional[CommunityMemberType] = "resident"
    area_id: Optional[uuid.UUID] = None
    bio: Optional[str] = None
    # Authority
    department: Optional[str] = None
    designation: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_register_fields(cls, data: dict):
        if isinstance(data, dict):
            # Map 'name' to 'full_name' if full_name is missing
            if "name" in data and not data.get("full_name"):
                data["full_name"] = data["name"]
            if "email" in data and isinstance(data["email"], str):
                data["email"] = data["email"].strip() or None
            if "phone" in data and isinstance(data["phone"], str):
                data["phone"] = data["phone"].strip() or None
            if "full_name" in data and isinstance(data["full_name"], str):
                data["full_name"] = data["full_name"].strip()
        return data


class LoginRequest(BaseModel):
    username: str = Field(..., description="Email or mobile phone")
    password: str = Field(..., min_length=1)

    @model_validator(mode="before")
    @classmethod
    def normalize_login_fields(cls, data: dict):
        if isinstance(data, dict):
            # Map 'email' or 'phone' to 'username' if username is omitted
            if "username" not in data or not data["username"]:
                val = data.get("email") or data.get("phone")
                if val:
                    data["username"] = val
            if "username" in data and isinstance(data["username"], str):
                data["username"] = data["username"].strip()
        return data


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email_or_phone: str = Field(..., min_length=3, description="Registered email or phone number")


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1, description="Password reset token received via email/SMS")
    new_password: str = Field(..., min_length=6, description="New password")


class SendPhoneOTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, description="Pakistani or international phone number (+923001234567)")


class VerifyPhoneOTPRequest(BaseModel):
    phone: str = Field(..., min_length=10)
    otp: str = Field(..., min_length=4, max_length=10)


class AuthMessageResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[dict] = None


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    language: Optional[Literal["en", "ur", "ps"]] = None
    theme: Optional[Literal["lake", "glass"]] = None
    reduce_effects: Optional[bool] = None
    
    # Tourist
    home_city: Optional[str] = None
    nationality: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    budget_level: Optional[Literal["budget", "mid_range", "premium"]] = None
    travel_style: Optional[Literal["solo", "couple", "family", "friends", "group"]] = None
    interests: Optional[list[str]] = None

    # Business
    business_name: Optional[str] = None
    accommodation_type: Optional[str] = None
    contact_phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    address_text: Optional[str] = None
    registration_no: Optional[str] = None
    area_id: Optional[uuid.UUID] = None

    # Community
    bio: Optional[str] = None
    area_id: Optional[uuid.UUID] = None
    member_type: Optional[Literal["resident", "host", "artisan"]] = None

    model_config = ConfigDict(extra="forbid")
