import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const licenses = mysqlTable("licenses", {
  id: int("id").autoincrement().primaryKey(),
  accessKey: varchar("accessKey", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["available", "active", "disabled"]).default("available").notNull(),
  isInternalTest: boolean("isInternalTest").default(false).notNull(),
  plan: mysqlEnum("plan", ["free_trial", "limited", "open"]).default("limited").notNull(),
  usageLimit: int("usageLimit").default(60).notNull(),
  usageUsed: int("usageUsed").default(0).notNull(),
  boundUserId: int("boundUserId"),
  boundEmail: varchar("boundEmail", { length: 320 }),
  boundDeviceHash: varchar("boundDeviceHash", { length: 128 }),
  activatedAt: timestamp("activatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const licenseAttempts = mysqlTable("licenseAttempts", {
  id: int("id").autoincrement().primaryKey(),
  accessKey: varchar("accessKey", { length: 128 }).notNull(),
  userId: int("userId"),
  email: varchar("email", { length: 320 }),
  deviceHash: varchar("deviceHash", { length: 128 }),
  outcome: mysqlEnum("outcome", ["success", "rejected", "disabled", "not_found"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  analysisKey: varchar("analysisKey", { length: 512 }),
  pageCount: int("pageCount"),
  expiresAt: timestamp("expiresAt"),
  documentStatus: mysqlEnum("documentStatus", ["active", "failed", "expired"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const usageEvents = mysqlTable("usageEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  documentId: int("documentId"),
  eventType: mysqlEnum("eventType", ["upload", "summary", "question"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type License = typeof licenses.$inferSelect;
export type Document = typeof documents.$inferSelect;
