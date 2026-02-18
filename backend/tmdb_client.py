import os
from typing import List, Optional, Dict, Any

import requests
from dotenv import load_dotenv

from schemas import Movie

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
BASE_URL = "https://api.themoviedb.org/3"

if not TMDB_API_KEY:
    raise RuntimeError("TMDB_API_KEY not set")


session = requests.Session()
session.params = {"api_key": TMDB_API_KEY, "language": "en-US"}


def _get(path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    url = f"{BASE_URL}{path}"
    resp = session.get(url, params=params or {})
    resp.raise_for_status()
    return resp.json()


def search_movies(query: str, page_limit: int = 1) -> List[Movie]:
    """
    Search movies by free-text query (title-style search).
    """
    results: List[Movie] = []
    for page in range(1, page_limit + 1):
        data = _get(
            "/search/movie",
            {"query": query, "page": page, "include_adult": False},
        )
        for item in data.get("results", []):
            if not item.get("overview"):
                continue
            results.append(_movie_from_tmdb_search(item))
    return results


def discover_candidates(
    page_limit: int = 2,
) -> List[Movie]:
    """
    Retrieve a broad candidate set using TMDB 'discover' endpoint.
    For now we don't push many filters into TMDB; ranking is done downstream.
    """
    results: List[Movie] = []
    for page in range(1, page_limit + 1):
        params: Dict[str, Any] = {
            "sort_by": "popularity.desc",
            "include_adult": False,
            "page": page,
        }

        data = _get("/discover/movie", params)
        for item in data.get("results", []):
            results.append(_movie_from_tmdb_search(item))
    return results


def fetch_movie_details(movie_id: int) -> Movie:
    """
    Fetch full details for a single movie, including runtime.
    """
    data = _get(f"/movie/{movie_id}")
    return _movie_from_tmdb_detail(data)


def _movie_from_tmdb_search(item: Dict[str, Any]) -> Movie:
    """
    Normalize search/discover results into our Movie model.

    Note: runtime is often not available in search/discover, so we set it to 0.
    """
    return Movie(
        id=item["id"],
        title=item.get("title") or item.get("name") or "",
        rating=float(item.get("vote_average") or 0.0),
        popularity=float(item.get("popularity") or 0.0),
        # For now we keep raw genre_ids as strings; can map to names later.
        genres=[str(g) for g in item.get("genre_ids", [])],
        runtime=0,
        overview=item.get("overview") or "",
    )


def _movie_from_tmdb_detail(item: Dict[str, Any]) -> Movie:
    """
    Normalize detailed movie response (has runtime, genres objects, etc.).
    """
    genres = [g["name"] for g in item.get("genres", [])]
    return Movie(
        id=item["id"],
        title=item.get("title") or item.get("name") or "",
        rating=float(item.get("vote_average") or 0.0),
        popularity=float(item.get("popularity") or 0.0),
        genres=genres,
        runtime=int(item.get("runtime") or 0),
        overview=item.get("overview") or "",
    )
