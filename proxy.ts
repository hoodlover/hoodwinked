import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isApprovedHostEmail } from "@/lib/host-access";

const protectedHostPrefixes = ["/host", "/room", "/board"];

function isSignedInDemoPage(pathname: string, searchParams: URLSearchParams): boolean {
  return pathname === "/" && searchParams.get("local") === "1";
}

function isProtectedHostPage(pathname: string, searchParams: URLSearchParams): boolean {
  if (protectedHostPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  const role = searchParams.get("role")?.toLowerCase().replace(/[^a-z]/g, "");
  return role === "host";
}

function signInUrl(requestUrl: URL): URL {
  const url = new URL("/api/auth/signin", requestUrl);
  url.searchParams.set("callbackUrl", `${requestUrl.pathname}${requestUrl.search}`);
  return url;
}

export default auth((request) => {
  const { pathname, searchParams } = request.nextUrl;
  const isPictureApi = pathname === "/api/picture-image";
  const needsSignedInDemo = isSignedInDemoPage(pathname, searchParams);
  const needsApprovedHost = isPictureApi || isProtectedHostPage(pathname, searchParams);

  if (!needsSignedInDemo && !needsApprovedHost) return NextResponse.next();

  const email = request.auth?.user?.email ?? null;
  if (!email) {
    if (isPictureApi) {
      return NextResponse.json({ error: "Host sign-in required." }, { status: 401 });
    }
    return NextResponse.redirect(signInUrl(request.nextUrl));
  }

  if (needsSignedInDemo && !needsApprovedHost) return NextResponse.next();

  if (!isApprovedHostEmail(email)) {
    if (isPictureApi) {
      return NextResponse.json({ error: "Host access pending approval." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/host-access", request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/api/picture-image",
    "/((?!api/auth|_next/static|_next/image|favicon.ico|favicon-new.png|apple-touch-icon.png|android-chrome-192x192.png|android-chrome-512x512.png|site.webmanifest|.*\\..*).*)"
  ]
};
