import { NextResponse } from "next/server";
import { parseMood } from "@/app/lib/gemini";

interface ParseMoodRequestBody {
  mood: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ParseMoodRequestBody;

    if (typeof body.mood !== "string" || body.mood.trim().length === 0) {
      throw new Error("mood must be a non-empty string");
    }

    const parsed = await parseMood(body.mood);
    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
