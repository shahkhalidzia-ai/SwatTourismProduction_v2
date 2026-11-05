import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings

@pytest.mark.asyncio
async def test_finance_commission_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Fetch commission tiers
        res = await client.get(f"{settings.API_V1_STR}/finance/commission-tiers")
        assert res.status_code == 200
        tiers = res.json()
        assert len(tiers) >= 4
        verticals = [t["vertical"] for t in tiers]
        assert "hotel" in verticals
        assert "transport" in verticals
        assert "guide" in verticals
        assert "restaurant" in verticals

        # 2. Update hotel commission tier
        update_res = await client.put(
            f"{settings.API_V1_STR}/finance/commission-tiers",
            json={"vertical": "hotel", "default_rate": 11.5, "notes": "Updated Hotel Tier"}
        )
        assert update_res.status_code == 200
        assert update_res.json()["default_rate"] == 11.5

        # 3. Fetch financial stats
        stats_res = await client.get(f"{settings.API_V1_STR}/finance/stats")
        assert stats_res.status_code == 200
        stats = stats_res.json()
        assert "total_gmv" in stats
        assert "active_partners_count" in stats

        # 4. Generate monthly invoices
        inv_res = await client.post(f"{settings.API_V1_STR}/finance/invoices/generate-monthly?billing_period=2026-11")
        assert inv_res.status_code == 200
        invoices = inv_res.json()
        assert len(invoices) > 0
        first_inv = invoices[0]
        assert first_inv["onebill_consumer_id"].startswith("1002")
        assert first_inv["status"] in ["issued", "paid"]

        # 5. Pay invoice via 1Bill
        pay_res = await client.post(
            f"{settings.API_V1_STR}/finance/invoices/{first_inv['id']}/pay",
            json={"payment_method": "1bill", "payment_reference": "TEST-1BILL-REF-1234"}
        )
        assert pay_res.status_code == 200
        assert pay_res.json()["status"] == "paid"

        # 6. List payouts
        payouts_res = await client.get(f"{settings.API_V1_STR}/finance/payouts")
        assert payouts_res.status_code == 200
        payouts = payouts_res.json()
        assert len(payouts) > 0
        payout_id = payouts[0]["id"]

        # 7. Approve payout via SBP Raast
        approve_res = await client.post(f"{settings.API_V1_STR}/finance/payouts/{payout_id}/approve")
        assert approve_res.status_code == 200
        assert approve_res.json()["status"] == "transferred"
        assert approve_res.json()["transferred_at"] is not None

        # 8. Freeze another payout
        if len(payouts) > 1:
            freeze_id = payouts[1]["id"]
            freeze_res = await client.post(
                f"{settings.API_V1_STR}/finance/payouts/{freeze_id}/freeze",
                json={"notes": "Frozen for automated dispute test"}
            )
            assert freeze_res.status_code == 200
            assert freeze_res.json()["status"] == "frozen"
