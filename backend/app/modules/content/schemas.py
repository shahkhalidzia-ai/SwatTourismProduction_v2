from typing import List, Optional
from pydantic import BaseModel


class WeatherDaily(BaseModel):
    date: str
    weather_code: int
    condition: str
    temperature_max: float
    temperature_min: float
    precipitation_probability: int


class WeatherResponse(BaseModel):
    area: str
    latitude: float
    longitude: float
    current_temperature: float
    weather_code: int
    condition: str
    wind_speed: float
    humidity: int
    disclaimer: str = "Forecasts change. Check road status and advisories before travelling."
    daily: List[WeatherDaily]
    cached: bool = False


class InfoArticle(BaseModel):
    id: str
    category: str
    title: str
    content: str
