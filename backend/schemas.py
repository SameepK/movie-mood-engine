# schemas.py
from pydantic import BaseModel
from typing import List, Optional


class UserIntent(BaseModel):
    mood: Optional[str] = None
    energy_level: Optional[str] = None  # "low", "high", maybe later -2..+2
    genres: List[str] = []
    avoid_genres: List[str] = []
    content_type: str  # "movie" or "series"
    time_commitment: Optional[str] = None  # "short", "medium", "long"
    group_size: int = 1
    confidence: float = 0.0


class Movie(BaseModel):
    id: int
    title: str
    rating: float
    popularity: float
    genres: List[str]
    runtime: int
    overview: str


class Recommendation(BaseModel):
    movie: Movie
    score: float
    explanation: List[str]
