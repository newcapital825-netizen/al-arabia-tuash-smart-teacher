export type LicenseState = {
  status: "available" | "active" | "disabled";
  boundUserId: number | null;
  boundEmail: string | null;
  boundDeviceHash: string | null;
};
export type LicenseDecision = "bind" | "allow" | "reject-disabled" | "reject-account" | "reject-device";

export function evaluateLicense(license: LicenseState, userId: number, email: string | null, deviceHash: string): LicenseDecision {
  if (license.status === "disabled") return "reject-disabled";
  const sameAccount = license.boundUserId === userId || (!!license.boundEmail && !!email && license.boundEmail === email);
  if (license.status === "active" && !sameAccount) return "reject-account";
  if (license.status === "active" && license.boundDeviceHash && license.boundDeviceHash !== deviceHash) return "reject-device";
  if (license.status === "available") return "bind";
  return "allow";
}
