import hmac
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import httpx

from app.core.config import settings


class EasypaisaPaymentService:
    """
    Enterprise Easypaisa Payment Gateway integration for Swat Tourism Platform.
    Supports:
    - Mobile Account (MA) direct prompt (USSD/PIN)
    - Hosted Easypaisa Web Checkout
    - Instant Payment Notification (IPN) webhook verification
    - Transaction status inquiry
    """

    @staticmethod
    def generate_hash(params: Dict[str, Any]) -> str:
        """
        Generates HMAC-SHA256 signature for Easypaisa API request validation.
        """
        sorted_keys = sorted(params.keys())
        hash_string = "&".join(f"{k}={params[k]}" for k in sorted_keys if params[k] is not None)
        
        signature = hmac.new(
            settings.EASYPAISA_HASH_KEY.encode("utf-8"),
            hash_string.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        return signature

    @staticmethod
    def verify_ipn_signature(payload: Dict[str, Any], received_signature: str) -> bool:
        """
        Verifies the authenticity of Easypaisa IPN webhook callback.
        """
        params = {k: v for k, v in payload.items() if k not in ["hash", "signature"]}
        expected_sig = EasypaisaPaymentService.generate_hash(params)
        return hmac.compare_digest(expected_sig, received_signature)

    @classmethod
    async def initiate_mobile_account_payment(
        cls,
        order_id: str,
        amount: float,
        mobile_account_number: str,
        email: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Initiates an Easypaisa Mobile Account direct debit transaction.
        The customer receives a push notification / USSD prompt on their phone to approve with PIN.
        """
        formatted_amount = f"{amount:.2f}"
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        
        request_params = {
            "orderId": order_id,
            "storeId": settings.EASYPAISA_STORE_ID,
            "transactionAmount": formatted_amount,
            "transactionType": "MA",
            "mobileAccountNo": mobile_account_number,
            "emailAddress": email or "tourist@swattourism.pk",
            "timestamp": timestamp,
        }
        
        # Calculate checksum signature
        request_params["hash"] = cls.generate_hash(request_params)
        
        # If in sandbox / staging mode without active telco credentials, simulate realistic network exchange
        if settings.EASYPAISA_ENV == "sandbox":
            txn_ref = f"EP-MA-{uuid.uuid4().hex[:10].upper()}"
            return {
                "success": True,
                "status": "PAID",
                "transaction_id": txn_ref,
                "order_id": order_id,
                "amount": amount,
                "currency": "PKR",
                "payment_method": "EASYPAISA_MOBILE_ACCOUNT",
                "mobile_account": mobile_account_number,
                "paid_at": datetime.now(timezone.utc).isoformat(),
                "message": "Easypaisa Mobile Account transaction approved successfully.",
                "response_code": "0000",
                "receipt_url": f"/api/v1/bookings/{order_id}/receipt"
            }
        
        # Live endpoint invocation
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{settings.EASYPAISA_DIRECT_API_URL}/mobile-account",
                    json=request_params,
                    headers={"Content-Type": "application/json"}
                )
                res_data = response.json()
                
                if res_data.get("responseCode") == "0000":
                    return {
                        "success": True,
                        "status": "PAID",
                        "transaction_id": res_data.get("transactionId"),
                        "order_id": order_id,
                        "amount": amount,
                        "currency": "PKR",
                        "payment_method": "EASYPAISA_MOBILE_ACCOUNT",
                        "mobile_account": mobile_account_number,
                        "paid_at": datetime.now(timezone.utc).isoformat(),
                        "message": "Payment successful",
                        "response_code": "0000"
                    }
                else:
                    return {
                        "success": False,
                        "status": "FAILED",
                        "error": res_data.get("responseDesc", "Easypaisa transaction rejected or timed out"),
                        "response_code": res_data.get("responseCode")
                    }
            except Exception as e:
                return {
                    "success": False,
                    "status": "ERROR",
                    "error": str(e)
                }

    @classmethod
    def generate_checkout_url(cls, order_id: str, amount: float) -> Dict[str, Any]:
        """
        Generates hosted Easypaisa Web Checkout URL with secure query hash.
        """
        formatted_amount = f"{amount:.2f}"
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        
        params = {
            "orderId": order_id,
            "storeId": settings.EASYPAISA_STORE_ID,
            "amount": formatted_amount,
            "postBackURL": settings.EASYPAISA_CALLBACK_URL,
            "autoRedirect": "1",
            "timestamp": timestamp,
        }
        params["hash"] = cls.generate_hash(params)
        
        query_str = "&".join(f"{k}={v}" for k, v in params.items())
        checkout_url = f"{settings.EASYPAISA_CHECKOUT_URL}?{query_str}"
        
        return {
            "checkout_url": checkout_url,
            "order_id": order_id,
            "amount": amount,
            "store_id": settings.EASYPAISA_STORE_ID,
            "expires_in_minutes": 30
        }
