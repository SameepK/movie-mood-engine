import { NextResponse } from "next/server";
import { discoverMovies } from "@/app/lib/tmdb";

interface MoviesRequestBody {
  genres?: number[];
  minRating?: number;
  maxVoteCount?: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MoviesRequestBody;
    const movies = await discoverMovies({
      genres: body.genres,
      minRating: body.minRating,
      maxVoteCount: body.maxVoteCount,
    });

    return NextResponse.json(movies, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
