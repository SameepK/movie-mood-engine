from pydantic import BaseModel
from typing import List, Optional

class UserIntent(BaseModel):
    mood: str
    energy_level: Optional[str]
    genres: List[str]
    avoid_genres: List[str] = []
    content_type: str  # "movie" or "series"
    time_commitment: Optional[str]  # "short", "medium", "long"
    group_size: int = 1


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
    explanation: str
