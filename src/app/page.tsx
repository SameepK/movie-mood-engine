"use client";

import type { Movie } from "@/app/lib/tmdb";
import { FormEvent, useState } from "react";

export default function Home() {
  const [mood, setMood] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        const message =
          typeof data?.error === "string" ? data.error : "Request failed";
        setError(message);
        setResults([]);
        return;
      }
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setError("Something went wrong");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <main className="mx-auto max-w-xl">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">
          Movie mood search
        </h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Describe how you feel; results use default filters for now.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row">
          <label htmlFor="mood" className="sr-only">
            Mood
          </label>
          <input
            id="mood"
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="e.g. cozy rainy night..."
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-lg bg-zinc-900 px-5 py-2.5 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </form>
        {error && (
          <p
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}
        {!loading && results.length > 0 && (
          <ul className="mt-8 space-y-3 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            {results.map((movie) => (
              <li
                key={movie.id}
                className="flex items-baseline justify-between gap-4 border-b border-zinc-100 pb-3 last:border-0 dark:border-zinc-800/80"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {movie.title}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                  {movie.rating.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
