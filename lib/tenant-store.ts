/**
 * Mock Redis tenant lookup — in-memory Map for local demo.
 * Valid subdomains: acme, beta
 */
const TENANT_MAP = new Map<string, string>([
  ["acme", "tenant-acme-001"],
  ["beta", "tenant-beta-002"],
]);

export function getTenantIdBySubdomain(subdomain: string): string | undefined {
  return TENANT_MAP.get(subdomain.toLowerCase());
}

export function isKnownSubdomain(subdomain: string): boolean {
  return TENANT_MAP.has(subdomain.toLowerCase());
}
