import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getActiveLicenseForUser: vi.fn().mockResolvedValue({ id: 1, status: "active", boundUserId: 22, boundEmail: "test@example.com", boundDeviceHash: "device-12345678", plan: "limited", usageLimit: 60, usageUsed: 0 }),
  getDocument: vi.fn().mockResolvedValue(undefined),
  consumeUsage: vi.fn(),
  refundUsage: vi.fn(),
  usageBalance: vi.fn(),
}));
vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";
import { documents } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

function context(role: "user" | "admin" = "user"): TrpcContext {
  return { user: { id: 22, openId: "security-test", name: "Test", email: "test@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("router security boundaries", () => {
  it("blocks non-admin access to owner statistics", async () => { await expect(appRouter.createCaller(context("user")).owner.stats()).rejects.toMatchObject({ code: "FORBIDDEN" }); });
  it("does not expose extracted text columns in the database schema", () => { expect("extractedText" in documents).toBe(false); expect("summary" in documents).toBe(false); expect("analysisKey" in documents).toBe(true); });
  it("requires an existing user document before answering", async () => { await expect(appRouter.createCaller(context("user")).documents.ask({ documentId: 999999, question: "ما الفكرة؟", deviceHash: "device-12345678" })).rejects.toMatchObject({ code: "NOT_FOUND" }); });
});
