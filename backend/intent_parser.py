import re
from typing import List

from schemas import UserIntent


MOOD_KEYWORDS = {
    "stressed": ["stressed", "tired", "exhausted", "burnt out"],
    "happy": ["happy", "fun", "cheerful", "uplifting"],
    "sad": ["sad", "down", "lonely"],
    "intense": ["intense", "dark", "serious"],
}

GENRE_KEYWORDS = {
    "thriller": ["thriller", "suspense", "intense", "smart", "mind"],
    "comedy": ["comedy", "funny", "laugh", "lighthearted", "fun"],
    "drama": ["drama", "emotional", "deep", "meaningful"],
    "action": ["action", "fast", "explosive", "adrenaline"],
    "horror": ["horror", "scary", "frightening", "creepy"],
}

TIME_KEYWORDS = {
    "short": ["quick", "short", "not too long"],
    "long": ["binge", "long"],
    # "medium" can be implicit (no keyword)
}

NEGATION_PATTERNS = [
    r"not\s+\w*\s*{genre}",
    r"no\s+\w*\s*{genre}",
    r"don't want\s+\w*\s*{genre}",
    r"avoid\s+\w*\s*{genre}",
    r"nothing\s+\w*\s*{genre}",
]


def _is_negated(text: str, genre_keyword: str) -> bool:
    """
    Check if a genre keyword appears after a negation phrase.
    Example: "not horror" → True
    """
    for pattern_template in NEGATION_PATTERNS:
        pattern = pattern_template.format(genre=re.escape(genre_keyword))
        if re.search(pattern, text):
            return True
    return False

def parse_intent(text: str) -> UserIntent:
    """
    Rule-based parser that converts free text into a UserIntent.
    """
    text = text.lower()
    hits = 0

    # --- Mood ---
    mood = None
    for m, keywords in MOOD_KEYWORDS.items():
        if any(k in text for k in keywords):
            mood = m
            hits += 1
            break

    # --- Energy level (derived from mood, not guessed blindly) ---
    energy_level = None
    if mood == "stressed":
        energy_level = "low"
    elif mood == "intense":
        energy_level = "high"

    # --- Genres ---
    genres: List[str] = []
    avoid_genres: List[str] = []

    for genre, keywords in GENRE_KEYWORDS.items():
        matched_keyword = next((k for k in keywords if k in text), None)
        if matched_keyword:
            if _is_negated(text, matched_keyword):
                avoid_genres.append(genre)
                hits += 1
            else:
                genres.append(genre)
                hits += 1

    # --- Time commitment ---
    time_commitment = None
    for t, keywords in TIME_KEYWORDS.items():
        if any(k in text for k in keywords):
            time_commitment = t
            hits += 1
            break

    # --- Content type ---
    content_type = "series" if any(
        w in text for w in ["series", "show", "tv"]
    ) else "movie"
    hits += 1  # we always infer *some* content type

    # --- Confidence ---
    # Heuristic: we track up to 5 "signal slots" and normalize.
    confidence = min(hits / 5, 1.0)

    return UserIntent(
        mood=mood,
        energy_level=energy_level,
        genres=genres,
        avoid_genres=[],
        content_type=content_type,
        time_commitment=time_commitment,
        confidence=confidence,
    )

