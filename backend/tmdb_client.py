import os
from dotenv import load_dotenv

load_dotenv()  # loads .env file

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
BASE_URL = "https://api.themoviedb.org/3"

if not TMDB_API_KEY:
    raise RuntimeError("TMDB_API_KEY not set")
