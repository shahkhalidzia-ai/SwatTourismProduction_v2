from typing import List, Optional
from fastapi import APIRouter, Query

from app.modules.content.schemas import WeatherResponse, InfoArticle
from app.modules.content.service import ContentService

router = APIRouter(prefix="/content", tags=["content"])


@router.get("/weather", response_model=WeatherResponse)
async def get_weather(
    area: str = Query("kalam", description="Swat area: mingora, kalam, malam_jabba, bahrain, miandam, ushu, madyan")
):
    """Get live 5-day weather forecast from Open-Meteo with caching."""
    return await ContentService.get_weather(area)


@router.get("/faq", response_model=List[InfoArticle])
async def get_faqs():
    """Frequently asked questions for Swat tourists."""
    return [
        InfoArticle(
            id="faq-1",
            category="transport",
            title="What vehicle is required for Kalam and Mahodand Lake?",
            content="Standard cars can reach Kalam via the newly paved N-95 highway. For Mahodand Lake and Utror, a 4x4 Jeep is strongly advised due to unpaved rocky tracks."
        ),
        InfoArticle(
            id="faq-2",
            category="safety",
            title="What emergency numbers work in Swat?",
            content="Dial Rescue 1122 for immediate medical and rescue emergencies. Police Emergency is 15. Tourist facilitation desks are situated in Fizaghat and Kalam."
        ),
        InfoArticle(
            id="faq-3",
            category="money",
            title="Are credit cards accepted widely in upper Swat?",
            content="Cash (Pakistani Rupees) is heavily preferred in Kalam, Bahrain, and Ushu. ATMs are available in Mingora and limited in Kalam. Bring adequate cash for local crafts, jeeps, and food."
        ),
    ]
