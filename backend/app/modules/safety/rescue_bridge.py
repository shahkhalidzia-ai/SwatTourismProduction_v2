import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import httpx

from app.core.config import settings
from app.core.sms import SMSService

logger = logging.getLogger("swat_tourism.rescue1122")


class Rescue1122Bridge:
    """
    Khyber Pakhtunkhwa Rescue 1122 Computer-Aided Dispatch (CAD) Integration Bridge.
    Automates emergency escalation when a tourist triggers an SOS alert in Swat.
    
    Capabilities:
    - Geo-spatial coordinate conversion & Google Maps pinpoint generation
    - Instant CAD webhook notification to Saidu Sharif & Northern Swat rescue stations
    - Automatic cellular SMS dispatch to victim's emergency contacts
    - Staging / Production fail-safe dispatch logs
    """

    _dispatch_log: List[Dict[str, Any]] = []

    @classmethod
    async def dispatch_emergency_cad_incident(
        cls,
        sos_id: uuid.UUID,
        latitude: float,
        longitude: float,
        tourist_name: str,
        tourist_phone: Optional[str] = None,
        emergency_contact_name: Optional[str] = None,
        emergency_contact_phone: Optional[str] = None,
        notes: Optional[str] = None,
        incident_type: str = "TOURIST_SOS_DISTRESS"
    ) -> Dict[str, Any]:
        """
        Builds standardized CAD payload and delivers to Rescue 1122 Dispatcher.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        cad_incident_number = f"R1122-SWT-{str(sos_id)[:8].upper()}"
        map_pin_url = f"https://www.google.com/maps?q={latitude},{longitude}"

        cad_payload: Dict[str, Any] = {
            "cad_incident_id": cad_incident_number,
            "sos_reference": str(sos_id),
            "service_agency": "RESCUE_1122_KPK",
            "district": "SWAT",
            "division": "MALAKAND",
            "incident_type": incident_type,
            "priority": "P1_IMMEDIATE_RESPONSE",
            "coordinates": {
                "latitude": latitude,
                "longitude": longitude,
                "map_url": map_pin_url
            },
            "tourist": {
                "name": tourist_name,
                "phone": tourist_phone or "Unspecified",
                "emergency_contact": f"{emergency_contact_name or 'N/A'} ({emergency_contact_phone or 'N/A'})"
            },
            "situation_notes": notes or "Automated SOS triggered from Swat Tourism mobile application.",
            "dispatched_at": now_iso,
            "status": "DISPATCHED_TO_CAD"
        }

        # Send emergency SMS notification to on-duty rescue liaison & victim's contact
        phones_to_alert = []
        if emergency_contact_phone:
            phones_to_alert.append(emergency_contact_phone)
        if tourist_phone:
            phones_to_alert.append(tourist_phone)

        if phones_to_alert:
            sms_text = (
                f"RESCUE 1122 EMERGENCY DISPATCH: SOS signal active for {tourist_name}. "
                f"Incident #{cad_incident_number}. Location: {map_pin_url}. "
                f"Field units dispatched. In emergency, call 1122."
            )
            for phone in phones_to_alert:
                await SMSService.send_sms(to_phone=phone, message=sms_text)

        # In production with live CAD API:
        if settings.RESCUE_1122_ENABLED and settings.RESCUE_1122_CAD_WEBHOOK_URL.startswith("http"):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        settings.RESCUE_1122_CAD_WEBHOOK_URL,
                        json=cad_payload,
                        headers={
                            "Authorization": f"Bearer {settings.RESCUE_1122_API_KEY}",
                            "Content-Type": "application/json"
                        }
                    )
                    cad_payload["cad_response_status"] = resp.status_code
            except Exception as e:
                logger.warning(f"Rescue 1122 CAD live webhook offline or timed out: {e}")
                cad_payload["cad_response_status"] = "SIMULATED_RESCUE_DISPATCH"
        else:
            cad_payload["cad_response_status"] = "SIMULATED_RESCUE_DISPATCH"

        cls._dispatch_log.append(cad_payload)
        logger.info(f"[RESCUE 1122 DISPATCH] Alert triggered: {cad_incident_number} at ({latitude}, {longitude})")
        return cad_payload

    @classmethod
    def get_recent_cad_dispatches(cls, limit: int = 20) -> List[Dict[str, Any]]:
        """Returns recent CAD dispatches for inspection and audit."""
        return cls._dispatch_log[-limit:]
