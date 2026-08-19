import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getLicense: vi.fn(), getActiveLicenseForUser: vi.fn(), recordAttempt: vi.fn(), bindLicense: vi.fn(), listLicenses: vi.fn(), ownerStats: vi.fn(), createLicense: vi.fn(), setLicenseStatus: vi.fn(), getDocument: vi.fn(), recordUsage: vi.fn(), saveDocument: vi.fn(), updateDocument: vi.fn(), consumeUsage: vi.fn(), refundUsage: vi.fn(), purgeExpiredDocuments: vi.fn(), rebindLicenseDevice: vi.fn(), usageBalance: vi.fn((license: any) => license.plan === "open" ? null : Math.max((license.usageLimit ?? 60) - (license.usageUsed ?? 0), 0)),
}));
vi.mock("./db", () => dbMocks);
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn().mockResolvedValue(true) }));
vi.mock("./storage", () => ({ storagePut: vi.fn().mockResolvedValue({ key: "k", url: "/manus-storage/k" }), storageGetSignedUrl: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

import { appRouter } from "./routers";
import { storagePut } from "./storage";
import type { TrpcContext } from "./_core/context";

function context(role: "user" | "admin" = "user"): TrpcContext { return { user: { id: 9, openId: "integration", name: "User", email: "user@example.com", loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] }; }
const deviceHash = "device-12345678";
const activeLicense = { id: 1, status: "active" as const, isInternalTest: false, boundUserId: 9, boundEmail: "user@example.com", boundDeviceHash: deviceHash, plan: "limited" as const, usageLimit: 60, usageUsed: 0 };

describe("license and owner tRPC flows", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(storagePut).mockReset(); vi.mocked(storagePut).mockResolvedValue({ key: "k", url: "/manus-storage/k" }); dbMocks.listLicenses.mockResolvedValue([]); dbMocks.getActiveLicenseForUser.mockResolvedValue(undefined); dbMocks.consumeUsage.mockResolvedValue(true); dbMocks.refundUsage.mockResolvedValue(undefined); });
  it("binds an available license through license.activate", async () => {
    dbMocks.getLicense.mockResolvedValueOnce({ id: 1, accessKey: "ARABIA-INTERNAL-TEST-2026", status: "available", isInternalTest: true, boundUserId: null, boundEmail: null, boundDeviceHash: null, plan: "free_trial", usageLimit: 3, usageUsed: 0 });
    const result = await appRouter.createCaller(context()).license.activate({ accessKey: "ARABIA-INTERNAL-TEST-2026", deviceHash, termsAccepted: true });
    expect(result.success).toBe(true); expect(result.isInternalTest).toBe(true); expect(result.notice).toContain("للاختبار الداخلي فقط"); expect(dbMocks.bindLicense).toHaveBeenCalledWith(1, 9, "user@example.com", deviceHash);
  });
  it("rejects a different device through license.activate", async () => {
    dbMocks.getLicense.mockResolvedValueOnce({ id: 1, accessKey: "KEY-DEVICE", status: "active", boundUserId: 9, boundEmail: "user@example.com", boundDeviceHash: deviceHash });
    await expect(appRouter.createCaller(context()).license.activate({ accessKey: "KEY-DEVICE", deviceHash: "other-device-12345678", termsAccepted: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("rejects a different account through license.activate", async () => {
    dbMocks.getLicense.mockResolvedValueOnce({ id: 1, accessKey: "KEY-1", status: "active", boundUserId: 4, boundEmail: "other@example.com", boundDeviceHash: deviceHash });
    await expect(appRouter.createCaller(context()).license.activate({ accessKey: "key-1", deviceHash, termsAccepted: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("blocks upload when there is no active license", async () => {
    await expect(appRouter.createCaller(context()).documents.upload({ filename: "a.txt", mimeType: "text/plain", base64: "data:text/plain;base64,YQ==", deviceHash })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("rejects a disabled license through license.activate", async () => {
    dbMocks.getLicense.mockResolvedValueOnce({ id: 2, accessKey: "KEY-2", status: "disabled", boundUserId: 4, boundEmail: "other@example.com", boundDeviceHash: deviceHash });
    await expect(appRouter.createCaller(context()).license.activate({ accessKey: "key-2", deviceHash, termsAccepted: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMocks.recordAttempt).toHaveBeenCalled();
  });
  it("uploads a supported TXT file with an active license", async () => {
    dbMocks.getActiveLicenseForUser.mockResolvedValue(activeLicense); dbMocks.saveDocument.mockResolvedValueOnce(33);
    const result = await appRouter.createCaller(context()).documents.upload({ filename: "lesson.txt", mimeType: "text/plain", base64: "data:text/plain;base64,SGVsbG8=", deviceHash });
    expect(result.filename).toBe("lesson.txt"); expect(result.summary).toBeDefined(); expect(result.storageUrl).toContain("/manus-storage/"); expect(dbMocks.saveDocument).toHaveBeenCalled(); expect(dbMocks.updateDocument).toHaveBeenCalled(); expect(dbMocks.consumeUsage).toHaveBeenCalledWith(1);
  });
  it("marks a stored document failed when usage reservation is rejected", async () => {
    dbMocks.getActiveLicenseForUser.mockResolvedValue(activeLicense); dbMocks.saveDocument.mockResolvedValueOnce(35); dbMocks.consumeUsage.mockResolvedValueOnce(false);
    await expect(appRouter.createCaller(context()).documents.upload({ filename: "lesson.txt", mimeType: "text/plain", base64: "data:text/plain;base64,SGVsbG8=", deviceHash })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(dbMocks.updateDocument).toHaveBeenCalledWith(35, expect.objectContaining({ storageKey: "orphaned", documentStatus: "failed", analysisKey: null }));
  });
  it("marks a stored document failed when analysis storage fails", async () => {
    dbMocks.getActiveLicenseForUser.mockResolvedValue(activeLicense); dbMocks.saveDocument.mockResolvedValueOnce(36); dbMocks.consumeUsage.mockResolvedValueOnce(true); vi.mocked(storagePut).mockResolvedValueOnce({ key: "file-key", url: "/manus-storage/file-key" }).mockRejectedValueOnce(new Error("analysis storage failed"));
    await expect(appRouter.createCaller(context()).documents.upload({ filename: "lesson.txt", mimeType: "text/plain", base64: "data:text/plain;base64,SGVsbG8=", deviceHash })).rejects.toMatchObject({ code: "BAD_GATEWAY" });
    expect(dbMocks.updateDocument).toHaveBeenCalledWith(36, expect.objectContaining({ storageKey: "orphaned", documentStatus: "failed", analysisKey: null }));
    expect(dbMocks.refundUsage).toHaveBeenCalledWith(1);
  });
  it("blocks upload when the unified usage balance is exhausted", async () => {
    dbMocks.getActiveLicenseForUser.mockResolvedValue({ ...activeLicense, usageUsed: 60 });
    await expect(appRouter.createCaller(context()).documents.upload({ filename: "lesson.txt", mimeType: "text/plain", base64: "data:text/plain;base64,SGVsbG8=", deviceHash })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("uses an ASCII storage key while preserving the Arabic display filename", async () => {
    dbMocks.getActiveLicenseForUser.mockResolvedValue(activeLicense); dbMocks.saveDocument.mockResolvedValueOnce(34);
    await appRouter.createCaller(context()).documents.upload({ filename: "درس عربي.txt", mimeType: "text/plain", base64: "data:text/plain;base64,SGVsbG8=", deviceHash });
    expect(vi.mocked(storagePut)).toHaveBeenCalledWith(expect.stringMatching(/^student-files\/9\/[0-9a-f-]+\.txt$/), expect.anything(), "text/plain");
  });
  it("rejects unsupported types and oversized uploads before storage", async () => {
    dbMocks.getActiveLicenseForUser.mockResolvedValue(activeLicense);
    await expect(appRouter.createCaller(context()).documents.upload({ filename: "a.exe", mimeType: "application/x-msdownload", base64: "data:application/x-msdownload;base64,YQ==", deviceHash })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const huge = `data:text/plain;base64,${Buffer.alloc(21 * 1024 * 1024, 97).toString("base64")}`;
    await expect(appRouter.createCaller(context()).documents.upload({ filename: "huge.txt", mimeType: "text/plain", base64: huge, deviceHash })).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
  });
  it("rejects the reserved internal key from commercial issuance", async () => { await expect(appRouter.createCaller(context("admin")).owner.createLicense({ accessKey: "ARABIA-INTERNAL-TEST-2026" })).rejects.toMatchObject({ code: "BAD_REQUEST" }); });
  it("allows owner license listing and mutating routes for admins", async () => {
    dbMocks.listLicenses.mockResolvedValueOnce([{ id: 1, accessKey: "KEY-1", status: "available" }]); const caller = appRouter.createCaller(context("admin"));
    await expect(caller.owner.licenses()).resolves.toHaveLength(1); await expect(caller.owner.createLicense({ accessKey: "NEW-KEY-123" })).resolves.toEqual({ success: true, plan: "limited" });
    await expect(caller.owner.createLicense({ accessKey: "TRIAL-KEY-123", plan: "free_trial" })).resolves.toEqual({ success: true, plan: "free_trial" });
    await expect(caller.owner.createLicense({ accessKey: "OPEN-KEY-123", plan: "open" })).resolves.toEqual({ success: true, plan: "open" }); dbMocks.rebindLicenseDevice.mockResolvedValueOnce(undefined); await expect(caller.owner.rebindDevice({ licenseId: 1, deviceHash })).resolves.toEqual({ success: true, message: "تمت إعادة ربط الجهاز بموافقة المالك." }); expect(dbMocks.rebindLicenseDevice).toHaveBeenCalledWith(1, deviceHash); dbMocks.purgeExpiredDocuments.mockResolvedValueOnce(2); await expect(caller.owner.cleanupExpired()).resolves.toEqual({ purged: 2, retentionDays: 7 }); await expect(caller.owner.setLicenseStatus({ id: 1, status: "disabled" })).resolves.toEqual({ success: true }); await expect(appRouter.createCaller(context()).owner.licenses()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
