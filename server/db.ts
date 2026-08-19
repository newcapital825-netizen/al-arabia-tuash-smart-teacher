import { and, desc, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, licenses, licenseAttempts, documents, usageEvents } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  values.lastSignedIn ??= new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return rows[0]; }
export async function getLicense(accessKey: string) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(licenses).where(eq(licenses.accessKey, accessKey)).limit(1); return rows[0]; }
export async function getActiveLicenseForUser(userId: number) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(licenses).where(and(eq(licenses.boundUserId, userId), eq(licenses.status, "active"))).limit(1); return rows[0]; }
export async function consumeUsage(licenseId: number) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.update(licenses).set({ usageUsed: sql`${licenses.usageUsed} + 1` }).where(and(eq(licenses.id, licenseId), or(eq(licenses.plan, "open"), lt(licenses.usageUsed, licenses.usageLimit)))); return Number((result as any).affectedRows ?? 0) > 0; }
export async function refundUsage(licenseId: number) { const db = await getDb(); if (!db) return; await db.update(licenses).set({ usageUsed: sql`GREATEST(${licenses.usageUsed} - 1, 0)` }).where(eq(licenses.id, licenseId)); }
export function usageBalance(license: typeof licenses.$inferSelect) { return license.plan === "open" ? null : Math.max(license.usageLimit - license.usageUsed, 0); }
export async function recordAttempt(data: typeof licenseAttempts.$inferInsert) { const db = await getDb(); if (!db) return; await db.insert(licenseAttempts).values(data); }
export async function bindLicense(id: number, userId: number, email: string | null, deviceHash: string) { const db = await getDb(); if (!db) return; await db.update(licenses).set({ status: "active", boundUserId: userId, boundEmail: email, boundDeviceHash: deviceHash, activatedAt: new Date() }).where(eq(licenses.id, id)); }
export async function rebindLicenseDevice(id: number, deviceHash: string) { const db = await getDb(); if (!db) return; await db.update(licenses).set({ boundDeviceHash: deviceHash, activatedAt: new Date() }).where(eq(licenses.id, id)); }
export async function listLicenses() { const db = await getDb(); if (!db) return []; return db.select().from(licenses).orderBy(desc(licenses.createdAt)); }
export async function setLicenseStatus(id: number, status: "available" | "active" | "disabled") { const db = await getDb(); if (!db) return; await db.update(licenses).set({ status }).where(eq(licenses.id, id)); }
export async function createLicense(accessKey: string, plan: "free_trial" | "limited" | "open" = "limited") { const db = await getDb(); if (!db) return; const usageLimit = plan === "free_trial" ? 3 : plan === "limited" ? 60 : 0; await db.insert(licenses).values({ accessKey, status: "available", plan, usageLimit, usageUsed: 0 }); }
export async function saveDocument(data: typeof documents.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const result = await db.insert(documents).values(data); return Number(result[0].insertId); }
export async function updateDocument(id: number, data: Partial<typeof documents.$inferInsert>) { const db = await getDb(); if (!db) return; await db.update(documents).set(data).where(eq(documents.id, id)); }
export async function getDocument(id: number, userId: number) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.userId, userId), eq(documents.documentStatus, "active"), or(isNull(documents.expiresAt), gt(documents.expiresAt, new Date())))).limit(1); return rows[0]; }
export async function purgeExpiredDocuments() { const db = await getDb(); if (!db) return 0; const result = await db.update(documents).set({ storageKey: "expired", analysisKey: null, documentStatus: "expired" }).where(and(lt(documents.expiresAt, new Date()), eq(documents.documentStatus, "active"))); return Number((result as any).affectedRows ?? 0); }
export async function recordUsage(data: typeof usageEvents.$inferInsert) { const db = await getDb(); if (!db) return; await db.insert(usageEvents).values(data); }
export async function ownerStats() { const db = await getDb(); if (!db) return { issued: 0, active: 0, uploads: 0 }; const [issued] = await db.select({ count: sql<number>`count(*)` }).from(licenses); const [active] = await db.select({ count: sql<number>`count(*)` }).from(licenses).where(eq(licenses.status, "active")); const [uploads] = await db.select({ count: sql<number>`count(*)` }).from(usageEvents).where(eq(usageEvents.eventType, "upload")); return { issued: Number(issued?.count ?? 0), active: Number(active?.count ?? 0), uploads: Number(uploads?.count ?? 0) }; }
