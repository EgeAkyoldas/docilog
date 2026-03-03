import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "docilog_session";

// Public paths that don't require auth
const PUBLIC_PATHS = [
  "/login",
  "/api/v1/auth/login",
  "/api/v1/auth/logout",
  "/_next",
  "/favicon.ico",
];

// Public blog paths (pattern: /[slug]/blog)
function isPublicBlogPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length >= 2 && segments[1] === "blog";
}

// Public API paths (pattern: /api/v1/[slug]/public)
function isPublicApiPath(pathname: string): boolean {
  return pathname.includes("/public/");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  for (const path of PUBLIC_PATHS) {
    if (pathname.startsWith(path)) {
      return NextResponse.next();
    }
  }

  // Allow public blog routes
  if (isPublicBlogPath(pathname)) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = request.cookies.get(SESSION_COOKIE);

  if (!session) {
    // Redirect to login for page requests, 401 for API
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
