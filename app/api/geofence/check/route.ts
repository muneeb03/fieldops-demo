import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GEOFENCE_WKT =
  "POLYGON((-74.010 40.700, -73.990 40.700, -73.990 40.720, -74.010 40.720, -74.010 40.700))";

type GeofenceBody = {
  lat?: unknown;
  lng?: unknown;
};

function parseCoordinate(value: unknown, name: string): number | null {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return null;
  }
  if (name === "lat" && (value < -90 || value > 90)) {
    return null;
  }
  if (name === "lng" && (value < -180 || value > 180)) {
    return null;
  }
  return value;
}

export async function POST(request: NextRequest) {
  let body: GeofenceBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const lat = parseCoordinate(body.lat, "lat");
  const lng = parseCoordinate(body.lng, "lng");

  if (lat === null || lng === null) {
    return NextResponse.json(
      {
        error:
          "lat and lng are required numbers (lat: -90..90, lng: -180..180)",
      },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$queryRaw<[{ inside: boolean }]>`
      SELECT ST_Contains(
        ST_GeomFromText(${GEOFENCE_WKT}, 4326),
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      ) AS inside
    `;

    const inside = Boolean(result[0]?.inside);

    return NextResponse.json({ inside, lat, lng });
  } catch (error) {
    console.error("Geofence check failed:", error);
    const message =
      error instanceof Error ? error.message : "Database query failed";

    if (
      message.includes("postgis") ||
      message.includes("ST_Contains") ||
      message.includes("function")
    ) {
      return NextResponse.json(
        {
          error:
            "PostGIS extension may not be enabled. Run: CREATE EXTENSION IF NOT EXISTS postgis;",
          details: message,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Geofence check failed", details: message },
      { status: 500 }
    );
  }
}
