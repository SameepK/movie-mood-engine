from typing import List, Tuple

from schemas import UserIntent, Movie, Recommendation


GENRE_WEIGHT = 3.0
AVOID_GENRE_PENALTY = -8.0
RATING_WEIGHT = 1.5
POPULARITY_WEIGHT = 0.5
RUNTIME_MISMATCH_PENALTY = -4.0


def _target_runtime_range(time_commitment: str) -> Tuple[int, int]:
    if time_commitment == "short":
        return 0, 110
    if time_commitment == "long":
        return 130, 1000
    # "medium" or unknown
    return 80, 180


def score_movie(intent: UserIntent, movie: Movie) -> Recommendation:
    """
    Assign a deterministic score to a movie given a user intent,
    and generate a human-readable explanation for that score.
    """
    explanation: List[str] = []
    score = 0.0

    # --- Genres ---
    intent_genres = set(intent.genres or [])
    movie_genres = set(movie.genres or [])
    genre_matches = intent_genres & movie_genres
    if genre_matches:
        score += GENRE_WEIGHT * len(genre_matches)
        explanation.append(f"Matches genres: {', '.join(genre_matches)}")

    avoid = set(intent.avoid_genres or [])
    bad_genres = movie_genres & avoid
    if bad_genres:
        score += AVOID_GENRE_PENALTY * len(bad_genres)
        explanation.append(f"Contains avoided genres: {', '.join(bad_genres)}")

    # --- Rating & popularity ---
    score += movie.rating * RATING_WEIGHT
    explanation.append(f"Has rating {movie.rating:.1f}")

    score += movie.popularity * POPULARITY_WEIGHT
    explanation.append("Popular with other viewers")

    # --- Runtime vs time commitment ---
    if intent.time_commitment and movie.runtime > 0:
        lo, hi = _target_runtime_range(intent.time_commitment)
        if lo <= movie.runtime <= hi:
            explanation.append(
                f"Runtime {movie.runtime} minutes fits your {intent.time_commitment} preference"
            )
        else:
            score += RUNTIME_MISMATCH_PENALTY
            explanation.append(
                f"Runtime {movie.runtime} minutes does not match your {intent.time_commitment} preference"
            )

    if not explanation:
        explanation.append("Selected based on overall score")

    return Recommendation(movie=movie, score=score, explanation=explanation)


def rank_movies(intent: UserIntent, movies: List[Movie]) -> List[Recommendation]:
    """
    Rank a list of movies for a given user intent, highest score first.
    """
    recs = [score_movie(intent, m) for m in movies]
    recs.sort(key=lambda r: r.score, reverse=True)
    return recs
