"use client";

import Link from "next/link";
import { useState } from "react";

type GeofenceResult = {
  inside: boolean;
  lat: number;
  lng: number;
};

export default function GeofencePage() {
  const [lat, setLat] = useState("40.710");
  const [lng, setLng] = useState("-74.000");
  const [result, setResult] = useState<GeofenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkGeofence(sampleLat?: number, sampleLng?: number) {
    const checkLat = sampleLat ?? parseFloat(lat);
    const checkLng = sampleLng ?? parseFloat(lng);

    if (Number.isNaN(checkLat) || Number.isNaN(checkLng)) {
      setError("Please enter valid numbers for lat and lng");
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/geofence/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: checkLat, lng: checkLng }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? data.details ?? "Request failed");
        return;
      }

      setResult(data as GeofenceResult);
      if (sampleLat !== undefined) {
        setLat(String(sampleLat));
        setLng(String(sampleLng));
      }
    } catch {
      setError("Network error — is the app and database running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <Link href="/" className="text-sm text-blue-600 underline">
        ← Home
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Geofence check</h1>
      <p className="mt-2 text-sm text-slate-600">
        Point-in-polygon via PostGIS ST_Contains (NYC bbox demo polygon).
      </p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Latitude</span>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Longitude</span>
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>

        <button
          type="button"
          onClick={() => checkGeofence()}
          disabled={loading}
          className="w-full rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Checking…" : "Check geofence"}
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => checkGeofence(40.71, -74.0)}
            className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Sample inside (40.710, -74.000)
          </button>
          <button
            type="button"
            onClick={() => checkGeofence(40.73, -74.0)}
            className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Sample outside (40.730, -74.000)
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <div
          className={`mt-4 rounded-lg px-4 py-3 ${
            result.inside
              ? "bg-green-50 text-green-800"
              : "bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-semibold">
            {result.inside ? "Inside geofence" : "Outside geofence"}
          </p>
          <p className="mt-1 text-sm">
            lat={result.lat}, lng={result.lng}
          </p>
        </div>
      )}
    </main>
  );
}
