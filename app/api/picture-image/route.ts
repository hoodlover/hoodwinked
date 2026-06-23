import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type ImageResponse = {
  data?: Array<{ b64_json?: string; revised_prompt?: string }>;
  error?: { message?: string; code?: string; type?: string };
};

const DEFAULT_MODEL = "gpt-image-2";
const DEFAULT_SIZE = "1024x1024";
const DEFAULT_QUALITY = "low";
const DEFAULT_FORMAT = "webp";

function cleanText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim().slice(0, 800) : fallback;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
    return NextResponse.json(
      {
        error: isProduction
          ? "OPENAI_API_KEY is not configured in the deployed environment. Add it in Vercel Project Settings -> Environment Variables, then redeploy."
          : "OPENAI_API_KEY is not configured. Add it to .env.local, then restart the dev server."
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const answer = cleanText(data.answer);
  const hint = cleanText(data.hint);
  const customPrompt = cleanText(data.prompt);

  if (!answer) {
    return NextResponse.json({ error: "Missing picture answer." }, { status: 400 });
  }

  const prompt =
    customPrompt ||
    [
      `Create a premium party-game reveal image whose answer is "${answer}".`,
      hint ? `Subtle clue to emphasize: ${hint}.` : "",
      "Make the subject recognizable after blur fades: centered composition, high contrast, rich color, cinematic lighting.",
      "Do not include text, labels, captions, logos, UI, watermarks, or written hints."
    ]
      .filter(Boolean)
      .join(" ");

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL ?? DEFAULT_MODEL,
      prompt,
      n: 1,
      size: process.env.OPENAI_IMAGE_SIZE ?? DEFAULT_SIZE,
      quality: process.env.OPENAI_IMAGE_QUALITY ?? DEFAULT_QUALITY,
      output_format: process.env.OPENAI_IMAGE_FORMAT ?? DEFAULT_FORMAT,
      output_compression: Number(process.env.OPENAI_IMAGE_COMPRESSION ?? 78),
      moderation: "auto"
    })
  });

  const requestId = response.headers.get("x-request-id") ?? undefined;
  const payload = (await response.json().catch(() => ({}))) as ImageResponse;
  if (!response.ok) {
    const detail = [
      payload.error?.message ?? "OpenAI image generation failed.",
      payload.error?.code ? `code: ${payload.error.code}` : "",
      requestId ? `request: ${requestId}` : ""
    ]
      .filter(Boolean)
      .join(" ");
    return NextResponse.json(
      { error: detail },
      { status: response.status }
    );
  }

  const image = payload.data?.[0];
  if (!image?.b64_json) {
    return NextResponse.json({ error: "OpenAI did not return an image." }, { status: 502 });
  }

  const format = process.env.OPENAI_IMAGE_FORMAT ?? DEFAULT_FORMAT;
  return NextResponse.json({
    src: `data:image/${format};base64,${image.b64_json}`,
    revisedPrompt: image.revised_prompt
  });
}
