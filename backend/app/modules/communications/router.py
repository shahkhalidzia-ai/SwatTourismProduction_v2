from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.modules.communications.whatsapp_service import WhatsAppService
from app.modules.communications.email_service import EmailService

router = APIRouter(prefix="/communications", tags=["communications"])


class WhatsAppTestPayload(BaseModel):
    to_phone: str
    message: str
    template: Optional[str] = None


class EmailTestPayload(BaseModel):
    to_email: EmailStr
    subject: str
    body_text: str
    body_html: Optional[str] = None


@router.get("/whatsapp/logs", response_model=List[Dict[str, Any]])
async def get_whatsapp_logs():
    """Retrieve in-memory audit log of dispatched WhatsApp messages."""
    return WhatsAppService.get_sent_messages()


@router.delete("/whatsapp/logs")
async def clear_whatsapp_logs():
    """Clear WhatsApp audit logs."""
    WhatsAppService.clear_sent_messages()
    return {"message": "WhatsApp audit logs cleared"}


@router.post("/whatsapp/test-send")
async def send_test_whatsapp(payload: WhatsAppTestPayload):
    """Dispatch a test WhatsApp message."""
    res = await WhatsAppService.send_whatsapp_message(
        to_phone=payload.to_phone,
        message_body=payload.message,
        template_name=payload.template or "manual_test",
    )
    return res


@router.get("/email/logs", response_model=List[Dict[str, Any]])
async def get_email_logs():
    """Retrieve in-memory audit log of dispatched emails."""
    return EmailService.get_sent_emails()


@router.delete("/email/logs")
async def clear_email_logs():
    """Clear email audit logs."""
    EmailService.clear_sent_emails()
    return {"message": "Email audit logs cleared"}


@router.post("/email/test-send")
async def send_test_email(payload: EmailTestPayload):
    """Dispatch a test transactional email."""
    html = payload.body_html or f"<p>{payload.body_text}</p>"
    res = await EmailService.send_email(
        to_email=payload.to_email,
        subject=payload.subject,
        html_body=html,
        text_body=payload.body_text,
        template_name="manual_test",
    )
    return res
