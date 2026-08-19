import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { documents } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";

function context(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: { id: 22, openId: "security-test", name: "Test", email: "test@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("router security boundaries", () => {
  it("blocks non-admin access to owner statistics", async () => {
    await expect(appRouter.createCaller(context("user")).owner.stats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("does not expose extracted text columns in the database schema", () => {
    expect("extractedText" in documents).toBe(false);
    expect("summary" in documents).toBe(false);
    expect("analysisKey" in documents).toBe(true);
  });
  it("requires an existing user document before answering", async () => {
    await expect(appRouter.createCaller(context("user")).documents.ask({ documentId: 999999, question: "ما الفكرة؟" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
