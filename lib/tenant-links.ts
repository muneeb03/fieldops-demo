export const DEMO_TENANTS = ["acme", "beta"] as const;
export const UNKNOWN_TENANT = "unknown";

export function tenantOrigin(
  subdomain: string,
  baseDomain: string,
  protocol = "https"
): string {
  return `${protocol}://${subdomain}.${baseDomain}`;
}
