"use client";

import type { ParsedMood } from "@/app/lib/gemini";
import type { Movie } from "@/app/lib/tmdb";
import { FormEvent, useState } from "react";

type Step = "input" | "confirm" | "results";

const INITIAL_ROLLS = 3;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isParsedMoodPayload(value: unknown): value is ParsedMood {
  if (!isRecord(value)) return false;
  const {
    genres,
    minRating,
    maxVoteCount,
    timeCommitment,
    mood,
    interpretation,
  } = value;
  if (!Array.isArray(genres) || !genres.every((g) => Number.isInteger(g))) {
    return false;
  }
  if (typeof minRating !== "number" || Number.isNaN(minRating)) return false;
  if (typeof maxVoteCount !== "number" || !Number.isFinite(maxVoteCount)) {
    return false;
  }
  if (
    timeCommitment !== "short" &&
    timeCommitment !== "medium" &&
    timeCommitment !== "long"
  ) {
    return false;
  }
  if (typeof mood !== "string" || mood.trim().length === 0) return false;
  if (typeof interpretation !== "string" || interpretation.trim().length === 0) {
    return false;
  }
  return true;
}

function isMovie(value: unknown): value is Movie {
  if (!isRecord(value)) return false;
  return (
    Number.isInteger(value.id) &&
    typeof value.title === "string" &&
    typeof value.overview === "string" &&
    typeof value.rating === "number" &&
    Number.isFinite(value.rating) &&
    typeof value.voteCount === "number" &&
    Number.isFinite(value.voteCount) &&
    typeof value.popularity === "number" &&
    Number.isFinite(value.popularity) &&
    Array.isArray(value.genres) &&
    value.genres.every((g) => Number.isInteger(g)) &&
    typeof value.runtime === "number" &&
    Number.isFinite(value.runtime) &&
    (value.posterPath === null || typeof value.posterPath === "string") &&
    typeof value.releaseYear === "number" &&
    Number.isInteger(value.releaseYear)
  );
}

function isMovieArray(value: unknown): value is Movie[] {
  return Array.isArray(value) && value.every(isMovie);
}

export default function Home() {
  const [step, setStep] = useState<Step>("input");
  const [moodInput, setMoodInput] = useState("");
  const [parsedMood, setParsedMood] = useState<ParsedMood | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [rollsRemaining, setRollsRemaining] = useState(INITIAL_ROLLS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetAll() {
    setStep("input");
    setMoodInput("");
    setParsedMood(null);
    setMovies([]);
    setRollsRemaining(INITIAL_ROLLS);
    setError(null);
    setLoading(false);
  }

  async function fetchMovies(
    filters: Pick<ParsedMood, "genres" | "minRating" | "maxVoteCount">,
  ): Promise<Movie[]> {
    const res = await fetch("/api/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        genres: filters.genres,
        minRating: filters.minRating,
        maxVoteCount: filters.maxVoteCount,
      }),
    });
    const data: unknown = await res.json();
    if (!res.ok) {
      const message =
        isRecord(data) && typeof data.error === "string"
          ? data.error
          : "Request failed";
      throw new Error(message);
    }
    if (!isMovieArray(data)) {
      throw new Error("Invalid movies response");
    }
    return data;
  }

  async function handleMoodSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!moodInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parse-mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: moodInput.trim() }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const message =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : "Could not parse mood";
        throw new Error(message);
      }
      if (!isParsedMoodPayload(data)) {
        throw new Error("Invalid parse response");
      }
      setParsedMood(data);
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleFindMovie() {
    if (!parsedMood) return;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchMovies({
        genres: parsedMood.genres,
        minRating: parsedMood.minRating,
        maxVoteCount: parsedMood.maxVoteCount,
      });
      setMovies(next);
      setRollsRemaining(INITIAL_ROLLS);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleReroll() {
    if (!parsedMood || rollsRemaining < 1) return;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchMovies({
        genres: parsedMood.genres,
        minRating: parsedMood.minRating,
        maxVoteCount: parsedMood.maxVoteCount,
      });
      setMovies(next);
      setRollsRemaining((r) => r - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <main className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">
          Movie mood search
        </h1>
        <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
          Describe how you feel, confirm the read, then get picks.
        </p>

        {step === "input" && (
          <form
            onSubmit={handleMoodSubmit}
            className="flex flex-col gap-4 sm:flex-row sm:items-start"
          >
            <label htmlFor="mood" className="sr-only">
              Mood
            </label>
            <input
              id="mood"
              type="text"
              value={moodInput}
              onChange={(e) => setMoodInput(e.target.value)}
              placeholder="e.g. cozy rainy night..."
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="submit"
              disabled={loading || !moodInput.trim()}
              className="shrink-0 rounded-lg bg-zinc-900 px-5 py-2.5 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Parsing…" : "Continue"}
            </button>
          </form>
        )}

        {step === "confirm" && parsedMood && (
          <div className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Mood
              </p>
              <p className="mt-1 text-lg font-medium capitalize text-zinc-900 dark:text-zinc-100">
                {parsedMood.mood}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                What we heard
              </p>
              <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                {parsedMood.interpretation}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleFindMovie()}
                className="rounded-lg bg-zinc-900 px-5 py-2.5 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {loading ? "Loading…" : "Find my movie"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={resetAll}
                className="rounded-lg border border-zinc-200 px-5 py-2.5 font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800/50"
              >
                Start over
              </button>
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {rollsRemaining > 0
                  ? `${rollsRemaining} re-roll${rollsRemaining === 1 ? "" : "s"} left`
                  : "No re-rolls left"}
              </p>
              <div className="flex flex-wrap gap-3">
                {rollsRemaining > 0 && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleReroll()}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800/50"
                  >
                    {loading ? "Loading…" : "Re-roll"}
                  </button>
                )}
                <button
                  type="button"
                  disabled={loading}
                  onClick={resetAll}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Start over
                </button>
              </div>
            </div>
            <ul className="space-y-4">
              {movies.map((movie) => (
                <li
                  key={movie.id}
                  className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {movie.title}
                    </h2>
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-sm tabular-nums text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {movie.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {movie.overview || "No overview available."}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
