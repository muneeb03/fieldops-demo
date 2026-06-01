import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractSubdomain } from "@/lib/subdomain";
import { getTenantIdBySubdomain } from "@/lib/tenant-store";
import {
  mergeSessionCookies,
  updateSession,
} from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request);

  const host = request.headers.get("host") ?? "";
  const subdomain = extractSubdomain(host);

  if (!subdomain) {
    return sessionResponse;
  }

  const tenantId = getTenantIdBySubdomain(subdomain);

  if (!tenantId) {
    return new NextResponse("Tenant not found", { status: 404 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-id", tenantId);

  const tenantResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  return mergeSessionCookies(sessionResponse, tenantResponse);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
