/**
 * Extract tenant subdomain from Host header.
 * Supports: acme.localhost:3000, acme.yourdomain.com
 * Skips platform hosts (*.vercel.app) so deploy previews work without a tenant.
 */

const PLATFORM_SUFFIXES = [
  "vercel.app",
  "railway.app",
  "onrender.com",
  "netlify.app",
  "fly.dev",
];

function isPlatformHost(hostname: string): boolean {
  return PLATFORM_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
  );
}

export function extractSubdomain(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase();

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  // fieldops-demo-beta.vercel.app → not a tenant subdomain
  if (isPlatformHost(hostname)) {
    return null;
  }

  const baseDomain = process.env.TENANT_BASE_DOMAIN?.toLowerCase();
  if (baseDomain) {
    if (hostname === baseDomain) {
      return null;
    }
    if (hostname.endsWith(`.${baseDomain}`)) {
      const sub = hostname.slice(0, -(baseDomain.length + 1));
      if (sub && !sub.includes(".")) {
        return sub;
      }
    }
    return null;
  }

  const parts = hostname.split(".");

  // acme.localhost → acme
  if (parts.length >= 2 && parts[parts.length - 1] === "localhost") {
    return parts[0] || null;
  }

  // acme.example.com → acme (requires at least 3 parts)
  if (parts.length >= 3) {
    return parts[0] || null;
  }

  return null;
}
