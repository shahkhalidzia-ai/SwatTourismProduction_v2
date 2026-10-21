import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict


DocTypeCode = Literal["registration", "identity_copy", "license", "gem_certificate", "safety_certificate", "other"]
DocStatusCode = Literal["pending", "approved", "rejected"]
VerificationStatusCode = Literal["unverified", "pending", "verified", "rejected", "suspended"]


class VerificationDocumentOut(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    doc_type: str
    file_url: str
    status: str
    reviewed_by: Optional[uuid.UUID] = None
    reviewed_at: Optional[datetime] = None
    note: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class VerificationDecisionRequest(BaseModel):
    status: Literal["approved", "rejected"]
    note: Optional[str] = Field(None, description="Reason if rejected, or notes if approved")


class BusinessVerificationStatusOut(BaseModel):
    business_id: uuid.UUID
    business_name: str
    verification_status: VerificationStatusCode
    registration_no: Optional[str] = None
    rejection_reason: Optional[str] = None
    verified_at: Optional[datetime] = None
    verified_by_name: Optional[str] = None
    documents: List[VerificationDocumentOut] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)


class ApprovalQueueItemOut(BaseModel):
    business_id: uuid.UUID
    business_name: str
    primary_type: str
    registration_no: Optional[str] = None
    contact_phone: str
    whatsapp_number: Optional[str] = None
    address_text: Optional[str] = None
    owner_name: str
    owner_email: Optional[str] = None
    verification_status: str
    rejection_reason: Optional[str] = None
    documents: List[VerificationDocumentOut] = Field(default_factory=list)
    pending_listings_count: int = 0
    submitted_at: datetime
    model_config = ConfigDict(from_attributes=True)


class AuditLogOut(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    action: str
    entity_type: str
    entity_id: Optional[uuid.UUID] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
