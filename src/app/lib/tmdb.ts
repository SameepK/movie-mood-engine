const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";

export interface Movie {
  id: number;
  title: string;
  overview: string;
  rating: number;
  voteCount: number;
  popularity: number;
  genres: number[];
  runtime: number;
  posterPath: string | null;
  releaseYear: number;
}

interface TMDBDiscoverMovie {
  id: number;
  title: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  poster_path: string | null;
  release_date: string;
}

interface TMDBDiscoverResponse {
  results: TMDBDiscoverMovie[];
}

interface DiscoverMoviesParams {
  genres?: number[];
  minRating?: number;
  maxVoteCount?: number;
  page?: number;
}

export async function discoverMovies({
  genres,
  minRating = 7.0,
  maxVoteCount = 100000,
  page = 1,
}: DiscoverMoviesParams = {}): Promise<Movie[]> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not set");
  }

  const searchParams = new URLSearchParams({
    api_key: apiKey,
    sort_by: "vote_average.desc",
    include_adult: "false",
    "vote_count.gte": "1000",
    "vote_average.gte": String(minRating),
    "vote_count.lte": String(maxVoteCount),
    page: String(page),
  });

  if (genres && genres.length > 0) {
    searchParams.set("with_genres", genres.join(","));
  }

  const response = await fetch(
    `${TMDB_API_BASE_URL}/discover/movie?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`TMDB discover request failed: ${response.status}`);
  }

  const data = (await response.json()) as TMDBDiscoverResponse;

  return data.results.map((movie) => ({
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    rating: movie.vote_average,
    voteCount: movie.vote_count,
    popularity: movie.popularity,
    genres: movie.genre_ids,
    runtime: 0,
    posterPath: movie.poster_path,
    releaseYear: Number.parseInt(movie.release_date?.slice(0, 4) ?? "0", 10) || 0,
  }));
}
