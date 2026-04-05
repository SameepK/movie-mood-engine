import { NextResponse } from "next/server";
import { discoverMovies } from "@/app/lib/tmdb";

interface MoviesRequestBody {
  genres?: number[];
  minRating?: number;
  maxVoteCount?: number;
}

const MAX_RESULTS = 3;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MoviesRequestBody;

    const genres = body.genres;
    const minRating = body.minRating;
    const maxVoteCount = body.maxVoteCount;

    if (
      genres !== undefined &&
      (!Array.isArray(genres) || !genres.every((g) => Number.isInteger(g)))
    ) {
      throw new Error("genres must be an array of integers");
    }
    if (minRating !== undefined && (typeof minRating !== "number" || Number.isNaN(minRating))) {
      throw new Error("minRating must be a number");
    }
    if (
      maxVoteCount !== undefined &&
      (typeof maxVoteCount !== "number" || !Number.isFinite(maxVoteCount))
    ) {
      throw new Error("maxVoteCount must be a finite number");
    }

    const movies = await discoverMovies({
      genres,
      minRating,
      maxVoteCount,
    });

    return NextResponse.json(movies.slice(0, MAX_RESULTS), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
