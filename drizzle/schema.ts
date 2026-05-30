import {
  bigint,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "nra_admin", "tax_officer", "omc_user"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── OMCs ─────────────────────────────────────────────────────────────────────
export const omcs = mysqlTable("omcs", {
  id: int("id").autoincrement().primaryKey(),
  registrationNumber: varchar("registrationNumber", { length: 64 }).notNull().unique(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  tradingName: varchar("tradingName", { length: 255 }),
  tinNumber: varchar("tinNumber", { length: 64 }),
  contactPerson: varchar("contactPerson", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 32 }),
  address: text("address"),
  status: mysqlEnum("status", ["active", "suspended", "revoked", "pending"]).default("pending").notNull(),
  licenseExpiry: timestamp("licenseExpiry"),
  depotCount: int("depotCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

// ─── Depots ───────────────────────────────────────────────────────────────────
export const depots = mysqlTable("depots", {
  id: int("id").autoincrement().primaryKey(),
  omcId: int("omcId").notNull(),
  depotName: varchar("depotName", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  depotCode: varchar("depotCode", { length: 32 }).unique(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Tax Returns ──────────────────────────────────────────────────────────────
export const taxReturns = mysqlTable("tax_returns", {
  id: int("id").autoincrement().primaryKey(),
  omcId: int("omcId").notNull(),
  periodYear: int("periodYear").notNull(),
  periodQuarter: int("periodQuarter").notNull(), // 1-4
  // Excise Duty
  exciseDeclaredVolume: decimal("exciseDeclaredVolume", { precision: 18, scale: 2 }),
  exciseDutyRate: decimal("exciseDutyRate", { precision: 10, scale: 4 }),
  exciseDutyAmount: decimal("exciseDutyAmount", { precision: 18, scale: 2 }),
  // VAT
  vatDeclaredVolume: decimal("vatDeclaredVolume", { precision: 18, scale: 2 }),
  vatRate: decimal("vatRate", { precision: 10, scale: 4 }),
  vatAmount: decimal("vatAmount", { precision: 18, scale: 2 }),
  // Petroleum Levy
  levyDeclaredVolume: decimal("levyDeclaredVolume", { precision: 18, scale: 2 }),
  levyRate: decimal("levyRate", { precision: 10, scale: 4 }),
  levyAmount: decimal("levyAmount", { precision: 18, scale: 2 }),
  // Totals
  totalDeclaredVolume: decimal("totalDeclaredVolume", { precision: 18, scale: 2 }),
  totalTaxDue: decimal("totalTaxDue", { precision: 18, scale: 2 }),
  totalPaid: decimal("totalPaid", { precision: 18, scale: 2 }),
  status: mysqlEnum("status", ["draft", "submitted", "under_review", "assessed", "overdue"]).default("draft").notNull(),
  submittedAt: timestamp("submittedAt"),
  dueDate: timestamp("dueDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  submittedBy: int("submittedBy"),
});

// ─── Consignments ─────────────────────────────────────────────────────────────
export const consignments = mysqlTable("consignments", {
  id: int("id").autoincrement().primaryKey(),
  consignmentRef: varchar("consignmentRef", { length: 64 }).notNull().unique(),
  omcId: int("omcId").notNull(),
  depotId: int("depotId"),
  productType: mysqlEnum("productType", ["petrol", "diesel", "kerosene", "lpg", "jet_fuel"]).notNull(),
  declaredVolumeLitres: decimal("declaredVolumeLitres", { precision: 18, scale: 2 }).notNull(),
  upliftDate: timestamp("upliftDate").notNull(),
  sourceTerminal: varchar("sourceTerminal", { length: 255 }),
  destinationDepot: varchar("destinationDepot", { length: 255 }),
  vehicleReg: varchar("vehicleReg", { length: 32 }),
  driverName: varchar("driverName", { length: 255 }),
  status: mysqlEnum("status", ["in_transit", "delivered", "verified", "flagged"]).default("in_transit").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── SICPA Verification Records ───────────────────────────────────────────────
export const sicpaRecords = mysqlTable("sicpa_records", {
  id: int("id").autoincrement().primaryKey(),
  consignmentId: int("consignmentId"),
  omcId: int("omcId").notNull(),
  depotId: int("depotId"),
  verificationRef: varchar("verificationRef", { length: 64 }).unique(),
  productType: mysqlEnum("productType", ["petrol", "diesel", "kerosene", "lpg", "jet_fuel"]).notNull(),
  declaredVolumeLitres: decimal("declaredVolumeLitres", { precision: 18, scale: 2 }).notNull(),
  verifiedVolumeLitres: decimal("verifiedVolumeLitres", { precision: 18, scale: 2 }).notNull(),
  varianceLitres: decimal("varianceLitres", { precision: 18, scale: 2 }),
  variancePercent: decimal("variancePercent", { precision: 8, scale: 4 }),
  discrepancyFlag: mysqlEnum("discrepancyFlag", ["none", "minor", "major", "critical"]).default("none").notNull(),
  verificationDate: timestamp("verificationDate").defaultNow().notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  notes: text("notes"),
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId"),
  userRole: varchar("userRole", { length: 32 }),
  action: varchar("action", { length: 128 }).notNull(),
  module: varchar("module", { length: 64 }).notNull(),
  entityType: varchar("entityType", { length: 64 }),
  entityId: int("entityId"),
  description: text("description"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Enforcement Cases ────────────────────────────────────────────────────────
export const enforcementCases = mysqlTable("enforcement_cases", {
  id: int("id").autoincrement().primaryKey(),
  caseRef: varchar("caseRef", { length: 64 }).notNull().unique(),
  omcId: int("omcId").notNull(),
  taxReturnId: int("taxReturnId"),
  caseType: mysqlEnum("caseType", ["default_assessment", "additional_assessment", "penalty", "interest"]).notNull(),
  status: mysqlEnum("status", ["open", "under_review", "notice_issued", "appealed", "resolved", "closed"]).default("open").notNull(),
  assessedAmount: decimal("assessedAmount", { precision: 18, scale: 2 }),
  penaltyAmount: decimal("penaltyAmount", { precision: 18, scale: 2 }),
  interestAmount: decimal("interestAmount", { precision: 18, scale: 2 }),
  totalDue: decimal("totalDue", { precision: 18, scale: 2 }),
  noticeIssuedAt: timestamp("noticeIssuedAt"),
  dueDate: timestamp("dueDate"),
  description: text("description"),
  assignedOfficerId: int("assignedOfficerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Payments ────────────────────────────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  paymentRef: varchar("paymentRef", { length: 64 }).notNull().unique(),
  omcId: int("omcId").notNull(),
  taxReturnId: int("taxReturnId"),
  enforcementCaseId: int("enforcementCaseId"),
  paymentType: mysqlEnum("paymentType", ["excise_duty", "vat", "petroleum_levy", "penalty", "interest", "other"]).notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("NLE").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "reversed"]).default("pending").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["bank_transfer", "cheque", "cash", "mobile_money", "online"]).default("bank_transfer"),
  bankName: varchar("bankName", { length: 128 }),
  bankRef: varchar("bankRef", { length: 128 }),
  proofFileKey: varchar("proofFileKey", { length: 512 }),
  proofFileName: varchar("proofFileName", { length: 255 }),
  proofFileUrl: varchar("proofFileUrl", { length: 1024 }),
  paidAt: timestamp("paidAt"),
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: int("verifiedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Penalties ────────────────────────────────────────────────────────────────
export const penalties = mysqlTable("penalties", {
  id: int("id").autoincrement().primaryKey(),
  penaltyRef: varchar("penaltyRef", { length: 64 }).notNull().unique(),
  omcId: int("omcId").notNull(),
  enforcementCaseId: int("enforcementCaseId"),
  taxReturnId: int("taxReturnId"),
  penaltyType: mysqlEnum("penaltyType", ["late_filing", "underpayment", "non_compliance", "fraud", "interest", "other"]).notNull(),
  principalAmount: decimal("principalAmount", { precision: 18, scale: 2 }).notNull(),
  penaltyAmount: decimal("penaltyAmount", { precision: 18, scale: 2 }).notNull(),
  interestAmount: decimal("interestAmount", { precision: 18, scale: 2 }).default("0"),
  totalDue: decimal("totalDue", { precision: 18, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["outstanding", "partial", "paid", "waived", "appealed"]).default("outstanding").notNull(),
  dueDate: timestamp("dueDate"),
  paidDate: timestamp("paidDate"),
  reason: text("reason"),
  issuedBy: int("issuedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Omc = typeof omcs.$inferSelect;
export type InsertOmc = typeof omcs.$inferInsert;
export type Depot = typeof depots.$inferSelect;
export type TaxReturn = typeof taxReturns.$inferSelect;
export type InsertTaxReturn = typeof taxReturns.$inferInsert;
export type Consignment = typeof consignments.$inferSelect;
export type SicpaRecord = typeof sicpaRecords.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type EnforcementCase = typeof enforcementCases.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type Penalty = typeof penalties.$inferSelect;
export type InsertPenalty = typeof penalties.$inferInsert;
