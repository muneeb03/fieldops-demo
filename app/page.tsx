import Link from "next/link";
import { headers } from "next/headers";

export default function HomePage() {
  const headersList = headers();
  const tenantId = headersList.get("x-tenant-id");

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">FieldOps Demo</h1>
      <p className="mt-2 text-slate-600">
        Upwork technical demo — multi-tenant middleware, PostGIS geofence, and
        real-time Socket.io.
      </p>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">1. Tenant middleware</h2>
        {tenantId ? (
          <p className="mt-2">
            Resolved tenant:{" "}
            <code className="rounded bg-slate-100 px-2 py-1 text-sm">
              {tenantId}
            </code>
          </p>
        ) : (
          <p className="mt-2 text-slate-600">
            No tenant on plain <code>localhost:3000</code>. Try{" "}
            <a
              href="http://acme.localhost:3000"
              className="text-blue-600 underline"
            >
              acme.localhost:3000
            </a>{" "}
            or{" "}
            <a
              href="http://beta.localhost:3000"
              className="text-blue-600 underline"
            >
              beta.localhost:3000
            </a>
            .
          </p>
        )}
        <p className="mt-2 text-sm text-slate-500">
          API:{" "}
          <Link href="/api/tenant" className="text-blue-600 underline">
            GET /api/tenant
          </Link>
        </p>
      </section>

      <nav className="mt-8 flex flex-col gap-3">
        <Link
          href="/geofence"
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm hover:bg-slate-50"
        >
          <span className="font-medium">2. Geofence test</span>
          <span className="mt-1 block text-sm text-slate-600">
            PostGIS ST_Contains check
          </span>
        </Link>
        <Link
          href="/realtime"
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm hover:bg-slate-50"
        >
          <span className="font-medium">3. Real-time counter</span>
          <span className="mt-1 block text-sm text-slate-600">
            Socket.io — open two tabs
          </span>
        </Link>
      </nav>
    </main>
  );
}
