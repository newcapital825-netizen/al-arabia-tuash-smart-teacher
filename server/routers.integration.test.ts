import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getLicense: vi.fn(), recordAttempt: vi.fn(), bindLicense: vi.fn(), listLicenses: vi.fn(), ownerStats: vi.fn(), createLicense: vi.fn(), setLicenseStatus: vi.fn(), getDocument: vi.fn(), recordUsage: vi.fn(), saveDocument: vi.fn(), updateDocument: vi.fn(),
}));
vi.mock("./db", () => dbMocks);
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn().mockResolvedValue(true) }));
vi.mock("./storage", () => ({ storagePut: vi.fn().mockResolvedValue({ key: "k", url: "/manus-storage/k" }), storageGetSignedUrl: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "user" | "admin" = "user"): TrpcContext { return { user: { id: 9, openId: "integration", name: "User", email: "user@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }

describe("license and owner tRPC flows", () => {
  it("binds an available license through license.activate", async () => {
    dbMocks.getLicense.mockResolvedValueOnce({ id: 1, accessKey: "KEY-1", status: "available", boundUserId: null, boundEmail: null });
    const result = await appRouter.createCaller(context()).license.activate({ accessKey: "key-1", deviceHash: "device-12345678", termsAccepted: true });
    expect(result.success).toBe(true); expect(dbMocks.bindLicense).toHaveBeenCalledWith(1, 9, "user@example.com", "device-12345678");
  });
  it("rejects a different account through license.activate", async () => {
    dbMocks.getLicense.mockResolvedValueOnce({ id: 1, accessKey: "KEY-1", status: "active", boundUserId: 4, boundEmail: "other@example.com" });
    await expect(appRouter.createCaller(context()).license.activate({ accessKey: "key-1", deviceHash: "device-12345678", termsAccepted: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("blocks upload when there is no active license", async () => {
    dbMocks.listLicenses.mockResolvedValueOnce([]);
    await expect(appRouter.createCaller(context()).documents.upload({ filename: "a.txt", mimeType: "text/plain", base64: "data:text/plain;base64,YQ==" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("rejects a disabled license through license.activate", async () => {
    dbMocks.getLicense.mockResolvedValueOnce({ id: 2, accessKey: "KEY-2", status: "disabled", boundUserId: 4, boundEmail: "other@example.com" });
    await expect(appRouter.createCaller(context()).license.activate({ accessKey: "key-2", deviceHash: "device-12345678", termsAccepted: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMocks.recordAttempt).toHaveBeenCalled();
  });
  it("uploads a supported TXT file with an active license", async () => {
    dbMocks.listLicenses.mockResolvedValue([{ id: 1, status: "active", boundUserId: 9, boundEmail: "user@example.com" }]);
    dbMocks.saveDocument.mockResolvedValueOnce(33);
    const result = await appRouter.createCaller(context()).documents.upload({ filename: "lesson.txt", mimeType: "text/plain", base64: "data:text/plain;base64,SGVsbG8=" });
    expect(result.filename).toBe("lesson.txt");
    expect(dbMocks.saveDocument).toHaveBeenCalled();
  });
  it("rejects unsupported types and oversized uploads before storage", async () => {
    dbMocks.listLicenses.mockResolvedValue([{ id: 1, status: "active", boundUserId: 9, boundEmail: "user@example.com" }]);
    await expect(appRouter.createCaller(context()).documents.upload({ filename: "a.exe", mimeType: "application/x-msdownload", base64: "data:application/x-msdownload;base64,YQ==" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const huge = `data:text/plain;base64,${Buffer.alloc(21 * 1024 * 1024, 97).toString("base64")}`;
    await expect(appRouter.createCaller(context()).documents.upload({ filename: "huge.txt", mimeType: "text/plain", base64: huge })).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
  });
  it("allows owner license listing and mutating routes for admins", async () => {
    dbMocks.listLicenses.mockResolvedValueOnce([{ id: 1, accessKey: "KEY-1", status: "available" }]);
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.owner.licenses()).resolves.toHaveLength(1);
    await expect(caller.owner.createLicense({ accessKey: "NEW-KEY-123" })).resolves.toEqual({ success: true });
    await expect(caller.owner.setLicenseStatus({ id: 1, status: "disabled" })).resolves.toEqual({ success: true });
    await expect(appRouter.createCaller(context()).owner.licenses()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
