import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getHostAccess } from "@/lib/host-access";

export const runtime = "nodejs";
export const maxDuration = 30;

const DEFAULT_VOICE_ID = "5AzhJWRutOfSFLB1xmmg";
const DEFAULT_MODEL = "eleven_flash_v2_5";
const DEFAULT_OUTPUT_FORMAT = "mp3_44100_128";

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 240) : "";
}

export async function POST(request: Request) {
  const access = getHostAccess(await auth());
  if (!access.signedIn) {
    return NextResponse.json({ error: "Host sign-in required." }, { status: 401 });
  }
  if (!access.approved) {
    return NextResponse.json({ error: "Host access pending approval." }, { status: 403 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY is not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const text = cleanText(data.text);
  if (!text) {
    return NextResponse.json({ error: "Missing voice text." }, { status: 400 });
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL ?? DEFAULT_MODEL;
  const outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT ?? DEFAULT_OUTPUT_FORMAT;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${encodeURIComponent(outputFormat)}`,
    {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: Number(process.env.ELEVENLABS_STABILITY ?? 0.48),
          similarity_boost: Number(process.env.ELEVENLABS_SIMILARITY_BOOST ?? 0.78),
          style: Number(process.env.ELEVENLABS_STYLE ?? 0.18),
          use_speaker_boost: process.env.ELEVENLABS_SPEAKER_BOOST !== "false"
        }
      })
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return NextResponse.json(
      { error: detail || "ElevenLabs voice generation failed." },
      { status: response.status }
    );
  }

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Cache-Control": "private, max-age=86400",
      "Content-Type": response.headers.get("content-type") ?? "audio/mpeg"
    }
  });
}
