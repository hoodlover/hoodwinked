import { NextResponse } from "next/server";
import { allowAllAuthenticatedHosts } from "@/lib/host-access";

function isSet(value: string | undefined): boolean {
  return !!value && value.trim().length > 0;
}

export function GET() {
  return NextResponse.json({
    authSecret: isSet(process.env.AUTH_SECRET),
    googleId: isSet(process.env.AUTH_GOOGLE_ID) || isSet(process.env.GOOGLE_CLIENT_ID),
    googleSecret: isSet(process.env.AUTH_GOOGLE_SECRET) || isSet(process.env.GOOGLE_CLIENT_SECRET),
    authUrl: isSet(process.env.AUTH_URL) || isSet(process.env.NEXTAUTH_URL),
    authDebug: process.env.AUTH_DEBUG === "true",
    approvedHosts: isSet(process.env.APPROVED_HOST_EMAILS),
    allowAllAuthenticatedHosts: allowAllAuthenticatedHosts(),
    elevenLabsKey: isSet(process.env.ELEVENLABS_API_KEY),
    elevenLabsVoice: isSet(process.env.ELEVENLABS_VOICE_ID)
  });
}
