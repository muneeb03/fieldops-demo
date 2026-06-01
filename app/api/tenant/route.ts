import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const headersList = headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return NextResponse.json(
      {
        tenantId: null,
        message:
          "No tenant resolved. Use a subdomain host like acme.localhost:3000",
      },
      { status: 200 }
    );
  }

  return NextResponse.json({ tenantId });
}
