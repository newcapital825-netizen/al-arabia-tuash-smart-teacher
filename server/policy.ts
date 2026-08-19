export type LicenseState = { status: "available" | "active" | "disabled"; boundUserId: number | null; boundEmail: string | null };
export type LicenseDecision = "bind" | "allow" | "reject-disabled" | "reject-account";

export function evaluateLicense(license: LicenseState, userId: number, email: string | null): LicenseDecision {
  if (license.status === "disabled") return "reject-disabled";
  const sameAccount = license.boundUserId === userId || (!!license.boundEmail && !!email && license.boundEmail === email);
  if (license.status === "active" && !sameAccount) return "reject-account";
  if (license.status === "available") return "bind";
  return "allow";
}
