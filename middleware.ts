import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REALM = "Wordlore Admin";

export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USERNAME;
  const pass = process.env.ADMIN_PASSWORD;

  if (!user || !pass) {
    return new NextResponse("Admin auth not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD on Vercel.", {
      status: 503,
    });
  }

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    let decoded = "";
    try {
      decoded = atob(header.slice(6));
    } catch {
      // malformed header, fall through to 401
    }
    const idx = decoded.indexOf(":");
    if (idx > -1) {
      const u = decoded.slice(0, idx);
      const p = decoded.slice(idx + 1);
      if (u === user && p === pass) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Auth required", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"` },
  });
}

export const config = {
  /*
   * ⚠️ EVERY ROUTE THAT CAN ACT MUST BE LISTED HERE.
   *
   * This matcher used to be `/admin/:path*` alone, while /api/schedule-week -
   * which publishes a week of episodes to five social accounts - sat outside
   * it, reachable by anyone on the internet with a POST. It returned 503 only
   * because AETHERWAVE_API_KEY was not set yet; the day that key landed, so
   * did the hole.
   *
   * A page being behind the gate does not put the endpoint it calls behind the
   * gate. Add the route here when you add the route.
   */
  matcher: ["/admin/:path*", "/api/schedule-week"],
};
