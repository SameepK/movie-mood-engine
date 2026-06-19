import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ParsedMood {
  genres: number[];
  minRating: number;
  maxVoteCount: number;
  timeCommitment: "short" | "medium" | "long";
  mood: string;
  interpretation: string;
}

function validateParsedMood(value: unknown): ParsedMood {
  if (typeof value !== "object" || value === null) {
    throw new Error("Gemini response is not a JSON object");
  }

  const candidate = value as Record<string, unknown>;
  const { genres, minRating, maxVoteCount, timeCommitment, mood, interpretation } =
    candidate;

  if (!Array.isArray(genres) || !genres.every((item) => Number.isInteger(item))) {
    throw new Error("Gemini response has invalid genres");
  }

  if (typeof minRating !== "number" || minRating < 6.0 || minRating > 9.0) {
    throw new Error("Gemini response has invalid minRating");
  }

  if (typeof maxVoteCount !== "number" || !Number.isFinite(maxVoteCount)) {
    throw new Error("Gemini response has invalid maxVoteCount");
  }

  if (
    timeCommitment !== "short" &&
    timeCommitment !== "medium" &&
    timeCommitment !== "long"
  ) {
    throw new Error("Gemini response has invalid timeCommitment");
  }

  if (typeof mood !== "string" || mood.trim().length === 0) {
    throw new Error("Gemini response has invalid mood");
  }

  if (typeof interpretation !== "string" || interpretation.trim().length === 0) {
    throw new Error("Gemini response has invalid interpretation");
  }

  return {
    genres,
    minRating,
    maxVoteCount,
    timeCommitment,
    mood,
    interpretation,
  };
}

const systemInstruction = `You are a mood-to-movie-criteria parser.
Return ONLY a raw JSON object with these exact fields:
genres: array of TMDB genre IDs as numbers
minRating: number between 6.0 and 9.0
maxVoteCount: number, default 100000
timeCommitment: "short", "medium", or "long"
mood: one word describing the mood
interpretation: one sentence explaining what you understood

TMDB genre IDs:
Action: 28
Comedy: 35
Drama: 18
Horror: 27
Romance: 10749
Thriller: 53
Animation: 16
Documentary: 99
Science Fiction: 878
Mystery: 9648

Do not wrap in markdown. Do not use backticks.`;

export async function parseMood(text: string): Promise<ParsedMood> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    systemInstruction,
  });

  const response = await model.generateContent(text);
  const rawText = response.response.text().trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("Gemini returned malformed JSON");
  }

  return validateParsedMood(parsed);
}
