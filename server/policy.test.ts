import { describe, expect, it } from "vitest";
import { evaluateLicense } from "./policy";

describe("license binding policy", () => {
  it("binds an available license on first activation", () => {
    expect(evaluateLicense({ status: "available", boundUserId: null, boundEmail: null }, 7, "student@example.com")).toBe("bind");
  });
  it("allows the bound account and rejects a different account", () => {
    const license = { status: "active" as const, boundUserId: 7, boundEmail: "student@example.com" };
    expect(evaluateLicense(license, 7, "student@example.com")).toBe("allow");
    expect(evaluateLicense(license, 8, "other@example.com")).toBe("reject-account");
  });
  it("rejects disabled licenses", () => {
    expect(evaluateLicense({ status: "disabled", boundUserId: 7, boundEmail: "student@example.com" }, 7, "student@example.com")).toBe("reject-disabled");
  });
});
