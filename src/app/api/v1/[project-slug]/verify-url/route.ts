import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, checkProjectAccess } from "@/lib/auth";

/**
 * GET /api/v1/[project-slug]/verify-url?url=https://example.com
 * Checks if a URL is alive via HEAD request with fallback to GET.
 * Returns { alive: boolean, status?: number }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ "project-slug": string }> }
) {
  const { "project-slug": projectSlug } = await params;
  const user = await verifyAuth(request);
  if (!user || !(await checkProjectAccess(user, projectSlug))) {
    return NextResponse.json({ alive: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ alive: false, error: "No URL provided" }, { status: 400 });
  }

  try {
    // Validate URL format
    new URL(url);
  } catch {
    return NextResponse.json({ alive: false, error: "Invalid URL" });
  }

  try {
    // Try HEAD first (faster, less data)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    let res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BlogLinkChecker/1.0)",
      },
    });
    clearTimeout(timeout);

    // Some servers reject HEAD, try GET
    if (res.status === 405 || res.status === 403) {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 4000);
      res = await fetch(url, {
        method: "GET",
        signal: controller2.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; BlogLinkChecker/1.0)",
        },
      });
      clearTimeout(timeout2);
    }

    const alive = res.status >= 200 && res.status < 400;
    return NextResponse.json({ alive, status: res.status });
  } catch (error) {
    console.warn(`[Verify URL] Failed for ${url}:`, error instanceof Error ? error.message : "timeout");
    return NextResponse.json({ alive: false, error: "Request failed" });
  }
}
