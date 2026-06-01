import Link from "next/link";
import { headers } from "next/headers";
import {
  DEMO_TENANTS,
  UNKNOWN_TENANT,
  tenantOrigin,
} from "@/lib/tenant-links";

export default function HomePage() {
  const headersList = headers();
  const tenantId = headersList.get("x-tenant-id");
  const tenantBase = process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN?.toLowerCase();

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
            No tenant on this host. Use a tenant subdomain below.
          </p>
        )}
        <p className="mt-2 text-sm text-slate-500">
          API:{" "}
          <Link href="/api/tenant" className="text-blue-600 underline">
            GET /api/tenant
          </Link>
        </p>

        <div className="mt-4 space-y-3 text-sm">
          <p className="font-medium text-slate-700">Local (no DNS setup)</p>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            {DEMO_TENANTS.map((sub) => (
              <li key={sub}>
                <a
                  href={`http://${sub}.localhost:3000`}
                  className="text-blue-600 underline"
                >
                  {sub}.localhost:3000
                </a>
              </li>
            ))}
            <li>
              <a
                href={`http://${UNKNOWN_TENANT}.localhost:3000`}
                className="text-blue-600 underline"
              >
                {UNKNOWN_TENANT}.localhost:3000
              </a>{" "}
              → 404
            </li>
          </ul>

          {tenantBase ? (
            <>
              <p className="font-medium text-slate-700">Production</p>
              <ul className="list-inside list-disc space-y-1 text-slate-600">
                {DEMO_TENANTS.map((sub) => (
                  <li key={sub}>
                    <a
                      href={tenantOrigin(sub, tenantBase)}
                      className="text-blue-600 underline"
                    >
                      {sub}.{tenantBase}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href={tenantOrigin(UNKNOWN_TENANT, tenantBase)}
                    className="text-blue-600 underline"
                  >
                    {UNKNOWN_TENANT}.{tenantBase}
                  </a>{" "}
                  → 404
                </li>
              </ul>
            </>
          ) : (
            <p className="rounded bg-amber-50 px-3 py-2 text-amber-900">
              Live tenant subdomains need a custom domain on Vercel (not{" "}
              <code>*.vercel.app</code>). Set{" "}
              <code>TENANT_BASE_DOMAIN</code> and{" "}
              <code>NEXT_PUBLIC_TENANT_BASE_DOMAIN</code> — see README.
            </p>
          )}
        </div>
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
