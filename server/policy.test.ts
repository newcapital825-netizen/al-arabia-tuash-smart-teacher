import { describe, expect, it } from "vitest";
import { evaluateLicense } from "./policy";

describe("license binding policy", () => {
  it("binds an available license on first activation", () => {
    expect(evaluateLicense({ status: "available", boundUserId: null, boundEmail: null, boundDeviceHash: null }, 7, "student@example.com", "device-12345678")).toBe("bind");
  });
  it("allows the bound account and rejects a different account", () => {
    const license = { status: "active" as const, boundUserId: 7, boundEmail: "student@example.com", boundDeviceHash: "device-12345678" };
    expect(evaluateLicense(license, 7, "student@example.com", "device-12345678")).toBe("allow");
    expect(evaluateLicense(license, 8, "other@example.com", "device-12345678")).toBe("reject-account");
  });
  it("rejects a different device", () => {
    const license = { status: "active" as const, boundUserId: 7, boundEmail: "student@example.com", boundDeviceHash: "device-12345678" };
    expect(evaluateLicense(license, 7, "student@example.com", "other-device-12345678")).toBe("reject-device");
  });
  it("rejects disabled licenses", () => {
    expect(evaluateLicense({ status: "disabled", boundUserId: 7, boundEmail: "student@example.com", boundDeviceHash: "device-12345678" }, 7, "student@example.com", "device-12345678")).toBe("reject-disabled");
  });
});
