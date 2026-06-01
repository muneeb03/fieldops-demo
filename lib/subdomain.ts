/**
 * Extract subdomain from Host header.
 * Supports: acme.localhost:3000, acme.example.com, localhost (no subdomain)
 */
export function extractSubdomain(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase();

  if (hostname === "localhost" || hostname === "127.0.0.1") {
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
