from schemas.intent import UserIntent

MOOD_KEYWORDS = {
    "stressed": ["stressed", "tired", "exhausted", "burnt out"],
    "happy": ["happy", "fun", "cheerful", "uplifting"],
    "sad": ["sad", "down", "lonely"],
    "intense": ["intense", "dark", "serious"]
}

GENRE_KEYWORDS = {
    "thriller": ["thriller", "suspense"],
    "comedy": ["comedy", "funny", "laugh"],
    "drama": ["drama", "emotional"],
    "action": ["action", "fast"]
}

TIME_KEYWORDS = {
    "short": ["quick", "short", "not too long"],
    "long": ["binge", "long"]
}

def parse_intent(text: str) -> UserIntent:
    text = text.lower()
    hits = 0

    # --- Mood ---
    mood = None
    for m, keywords in MOOD_KEYWORDS.items():
        if any(k in text for k in keywords):
            mood = m
            hits += 1
            break

    # --- Energy level (derived, not guessed) ---
    energy_level = None
    if mood == "stressed":
        energy_level = "low"
    elif mood == "intense":
        energy_level = "high"

    # --- Genres ---
    genres = []
    for genre, keywords in GENRE_KEYWORDS.items():
        if any(k in text for k in keywords):
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
    content_type = "series" if any(w in text for w in ["series", "show", "tv"]) else "movie"
    hits += 1

    # --- Confidence ---
    confidence = min(hits / 5, 1.0)

    return UserIntent(
        mood=mood,
        energy_level=energy_level,
        genres=genres,
        avoid_genres=[],
        content_type=content_type,
        time_commitment=time_commitment,
        confidence=confidence
    )
