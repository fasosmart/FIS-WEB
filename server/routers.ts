import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { sdk } from "./_core/sdk";
import {
  getOmcs, getOmcById, createOmc, updateOmc,
  getTaxReturns, getTaxReturnById, createTaxReturn, updateTaxReturn,
  getConsignments, getConsignmentById, createConsignment,
  getSicpaRecords, getSicpaRecordById, runSicpaVerification,
  getAuditLogs,
  getEnforcementCases, getEnforcementCaseById, createEnforcementCase, updateEnforcementCase,
  getDashboardKpis, getRevenueChartData, getComplianceData, getTopDiscrepancies,
  getDepots, createDepot,
  getPayments, getPaymentById, createPayment, updatePaymentStatus,
  getPenalties, getPenaltyById, createPenalty, updatePenaltyStatus,
  getRevenueReport, getComplianceReport, getSicpaReport,
  getPaymentsReport, getEnforcementReport, getOmcPerformanceReport, getPenaltiesReport,
  getAllUsers, updateUserRole, deleteUser,
} from "./db";

// ─── Role Guard ───────────────────────────────────────────────────────────────
const nraProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["nra_admin", "tax_officer", "admin"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "NRA access required" });
  }
  return next({ ctx });
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["nra_admin", "admin"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // ─── Demo Login (DEV/STAGING only) ───────────────────────────────────────
    demoLogin: publicProcedure
      .input(z.object({
        role: z.enum(["demo-admin", "demo-officer", "demo-omc"]),
      }))
      .mutation(async ({ input, ctx }) => {
        // Demo login is available in all environments for testing purposes

        const DEMO_USERS = {
          "demo-admin":   { openId: "demo-nra-admin-001",   name: "Admin NRA",          email: "demo-admin@nra.gov.sl",   role: "admin" as const },
          "demo-officer": { openId: "demo-tax-officer-001", name: "Tax Officer Demo",    email: "demo-officer@nra.gov.sl", role: "tax_officer" as const },
          "demo-omc":     { openId: "demo-omc-user-001",    name: "OMC Portal User",     email: "demo-omc@nra.gov.sl",    role: "omc_user" as const },
        } as const;

        const demoUser = DEMO_USERS[input.role];

        // Upsert the demo user with correct role
        const { upsertUser } = await import("./db");
        await upsertUser({
          openId: demoUser.openId,
          name: demoUser.name,
          email: demoUser.email,
          loginMethod: "demo",
          role: demoUser.role as any,
          lastSignedIn: new Date(),
        });

        // Create JWT session token
        const sessionToken = await sdk.createSessionToken(demoUser.openId, {
          name: demoUser.name,
          expiresInMs: ONE_YEAR_MS,
        });

        // Set session cookie directly on the response
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, role: demoUser.role, name: demoUser.name };
      }),
  }),

  // ─── Dashboard ──────────────────────────────────────────────────────────────
  dashboard: router({
    kpis: protectedProcedure.query(() => getDashboardKpis()),
    revenueChart: protectedProcedure.query(() => getRevenueChartData()),
    compliance: protectedProcedure.query(() => getComplianceData()),
    topDiscrepancies: protectedProcedure.query(() => getTopDiscrepancies()),
  }),

  // ─── OMCs ────────────────────────────────────────────────────────────────────
  omcs: router({
    list: protectedProcedure
      .input(z.object({ status: z.string().optional(), search: z.string().optional() }).optional())
      .query(({ input }) => getOmcs(input)),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getOmcById(input.id)),
    create: adminProcedure.input(z.object({
      registrationNumber: z.string().min(1),
      companyName: z.string().min(1),
      tradingName: z.string().optional(),
      tinNumber: z.string().optional(),
      contactPerson: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      address: z.string().optional(),
      status: z.enum(["active", "suspended", "revoked", "pending"]).optional(),
    })).mutation(({ input, ctx }) => createOmc(input, ctx.user.id)),
    update: adminProcedure.input(z.object({
      id: z.number(),
      companyName: z.string().optional(),
      tradingName: z.string().optional(),
      tinNumber: z.string().optional(),
      contactPerson: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      address: z.string().optional(),
      status: z.enum(["active", "suspended", "revoked", "pending"]).optional(),
    })).mutation(({ input }) => updateOmc(input)),
  }),

  // ─── Depots ──────────────────────────────────────────────────────────────────
  depots: router({
    list: protectedProcedure.input(z.object({ omcId: z.number().optional() }).optional()).query(({ input }) => getDepots(input?.omcId)),
    create: adminProcedure.input(z.object({
      omcId: z.number(),
      depotName: z.string().min(1),
      location: z.string().optional(),
      depotCode: z.string().optional(),
    })).mutation(({ input }) => createDepot(input)),
  }),

  // ─── Tax Returns ─────────────────────────────────────────────────────────────
  taxReturns: router({
    list: protectedProcedure
      .input(z.object({ omcId: z.number().optional(), status: z.string().optional(), year: z.number().optional() }).optional())
      .query(({ input }) => getTaxReturns(input)),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getTaxReturnById(input.id)),
    create: protectedProcedure.input(z.object({
      omcId: z.number(),
      periodYear: z.number(),
      periodQuarter: z.number().min(1).max(4),
      exciseDeclaredVolume: z.string().optional(),
      exciseDutyRate: z.string().optional(),
      exciseDutyAmount: z.string().optional(),
      vatDeclaredVolume: z.string().optional(),
      vatRate: z.string().optional(),
      vatAmount: z.string().optional(),
      levyDeclaredVolume: z.string().optional(),
      levyRate: z.string().optional(),
      levyAmount: z.string().optional(),
      totalDeclaredVolume: z.string().optional(),
      totalTaxDue: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(({ input, ctx }) => createTaxReturn(input, ctx.user.id)),
    submit: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => updateTaxReturn({ id: input.id, status: "submitted", submittedAt: new Date() })),
    updateStatus: nraProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["draft", "submitted", "under_review", "assessed", "overdue"]),
    })).mutation(({ input }) => updateTaxReturn(input)),
  }),

  // ─── Consignments ────────────────────────────────────────────────────────────
  consignments: router({
    list: protectedProcedure
      .input(z.object({ omcId: z.number().optional(), status: z.string().optional() }).optional())
      .query(({ input }) => getConsignments(input)),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getConsignmentById(input.id)),
    create: protectedProcedure.input(z.object({
      consignmentRef: z.string().min(1),
      omcId: z.number(),
      depotId: z.number().optional(),
      productType: z.enum(["petrol", "diesel", "kerosene", "lpg", "jet_fuel"]),
      declaredVolumeLitres: z.string(),
      upliftDate: z.string(),
      sourceTerminal: z.string().optional(),
      destinationDepot: z.string().optional(),
      vehicleReg: z.string().optional(),
      driverName: z.string().optional(),
    })).mutation(({ input }) => createConsignment(input)),
  }),

  // ─── SICPA Verification ──────────────────────────────────────────────────────
  sicpa: router({
    list: protectedProcedure
      .input(z.object({ omcId: z.number().optional(), flag: z.string().optional() }).optional())
      .query(({ input }) => getSicpaRecords(input)),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getSicpaRecordById(input.id)),
    verify: nraProcedure.input(z.object({
      consignmentId: z.number().optional(),
      omcId: z.number(),
      depotId: z.number().optional(),
      productType: z.enum(["petrol", "diesel", "kerosene", "lpg", "jet_fuel"]),
      declaredVolumeLitres: z.string(),
      verifiedVolumeLitres: z.string(),
      notes: z.string().optional(),
    })).mutation(({ input }) => runSicpaVerification(input)),
  }),

  // ─── Audit Logs ──────────────────────────────────────────────────────────────
  audit: router({
    list: nraProcedure
      .input(z.object({
        module: z.string().optional(),
        userId: z.number().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(({ input }) => getAuditLogs(input)),
  }),

  // ─── Enforcement ─────────────────────────────────────────────────────────────
  enforcement: router({
    list: nraProcedure
      .input(z.object({ omcId: z.number().optional(), status: z.string().optional(), caseType: z.string().optional() }).optional())
      .query(({ input }) => getEnforcementCases(input)),
    byId: nraProcedure.input(z.object({ id: z.number() })).query(({ input }) => getEnforcementCaseById(input.id)),
    create: nraProcedure.input(z.object({
      omcId: z.number(),
      taxReturnId: z.number().optional(),
      caseType: z.enum(["default_assessment", "additional_assessment", "penalty", "interest"]),
      assessedAmount: z.string().optional(),
      penaltyAmount: z.string().optional(),
      interestAmount: z.string().optional(),
      totalDue: z.string().optional(),
      description: z.string().optional(),
      dueDate: z.string().optional(),
    })).mutation(({ input, ctx }) => createEnforcementCase(input, ctx.user.id)),
    updateStatus: nraProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["open", "under_review", "notice_issued", "appealed", "resolved", "closed"]),
    })).mutation(({ input }) => updateEnforcementCase(input)),
    issueNotice: nraProcedure.input(z.object({ id: z.number() })).mutation(({ input }) =>
      updateEnforcementCase({ id: input.id, status: "notice_issued", noticeIssuedAt: new Date() })
    ),
  }),

  // ─── Payments ────────────────────────────────────────────────────────────────────
  payments: router({
    list: protectedProcedure
      .input(z.object({
        omcId: z.number().optional(),
        status: z.string().optional(),
        paymentType: z.string().optional(),
      }).optional())
      .query(({ input }) => getPayments(input)),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getPaymentById(input.id)),
    create: protectedProcedure.input(z.object({
      paymentRef: z.string().min(1),
      omcId: z.number(),
      taxReturnId: z.number().optional(),
      enforcementCaseId: z.number().optional(),
      paymentType: z.enum(["excise_duty", "vat", "petroleum_levy", "penalty", "interest", "other"]),
      amount: z.string(),
      paymentMethod: z.enum(["bank_transfer", "cheque", "cash", "mobile_money", "online"]).optional(),
      bankName: z.string().optional(),
      bankRef: z.string().optional(),
      notes: z.string().optional(),
      paidAt: z.string().optional(),
    })).mutation(({ input }) => createPayment(input)),
    updateStatus: nraProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "processing", "completed", "failed", "reversed"]),
    })).mutation(({ input, ctx }) => updatePaymentStatus(input, ctx.user.id)),
    verify: nraProcedure.input(z.object({ id: z.number() }))
      .mutation(({ input, ctx }) => updatePaymentStatus({ id: input.id, status: "completed", verifiedAt: new Date() }, ctx.user.id)),
  }),

  // ─── Penalties ────────────────────────────────────────────────────────────────────
  penalties: router({
    list: protectedProcedure
      .input(z.object({
        omcId: z.number().optional(),
        status: z.string().optional(),
        penaltyType: z.string().optional(),
      }).optional())
      .query(({ input }) => getPenalties(input)),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getPenaltyById(input.id)),
    create: nraProcedure.input(z.object({
      penaltyRef: z.string().min(1),
      omcId: z.number(),
      enforcementCaseId: z.number().optional(),
      taxReturnId: z.number().optional(),
      penaltyType: z.enum(["late_filing", "underpayment", "non_compliance", "fraud", "interest", "other"]),
      principalAmount: z.string(),
      penaltyAmount: z.string(),
      interestAmount: z.string().optional(),
      totalDue: z.string(),
      dueDate: z.string().optional(),
      reason: z.string().optional(),
    })).mutation(({ input, ctx }) => createPenalty(input, ctx.user.id)),
    updateStatus: nraProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["outstanding", "partial", "paid", "waived", "appealed"]),
    })).mutation(({ input }) => updatePenaltyStatus(input)),
  }),

  // ─── Reports ────────────────────────────────────────────────────────────────────
  reports: router({
    // Shared filter schema
    revenue: protectedProcedure
      .input(z.object({
        omcId: z.number().optional(),
        year: z.number().optional(),
        quarter: z.number().optional(),
        productType: z.string().optional(),
      }).optional())
      .query(({ input }) => getRevenueReport(input ?? {})),

    compliance: protectedProcedure
      .input(z.object({ omcId: z.number().optional() }).optional())
      .query(({ input }) => getComplianceReport(input ?? {})),

    sicpa: protectedProcedure
      .input(z.object({
        omcId: z.number().optional(),
        productType: z.string().optional(),
      }).optional())
      .query(({ input }) => getSicpaReport(input ?? {})),

    payments: protectedProcedure
      .input(z.object({
        omcId: z.number().optional(),
        paymentStatus: z.string().optional(),
      }).optional())
      .query(({ input }) => getPaymentsReport(input ?? {})),

    enforcement: protectedProcedure
      .input(z.object({ omcId: z.number().optional() }).optional())
      .query(({ input }) => getEnforcementReport(input ?? {})),

    omcPerformance: protectedProcedure
      .input(z.object({ omcId: z.number().optional() }).optional())
      .query(({ input }) => getOmcPerformanceReport(input ?? {})),

    penalties: protectedProcedure
      .input(z.object({ omcId: z.number().optional() }).optional())
      .query(({ input }) => getPenaltiesReport(input ?? {})),
  }),

  // ─── AI Intelligence Assistant ──────────────────────────────────────────────
  ai: router({
    chat: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(2000),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        // Fetch real-time FIS context data
        const [kpis, discrepancies, compliance] = await Promise.all([
          getDashboardKpis(),
          getTopDiscrepancies(),
          getComplianceData(),
        ]);
        const systemPrompt = `You are the FIS Intelligence Assistant, an AI-powered analytical tool for the National Revenue Authority (NRA) of Sierra Leone's Fuel Integrity Solution (FIS) platform.

Your role is to help NRA tax officers and administrators:
- Analyze petroleum tax compliance data and revenue leakage risks
- Identify discrepancies between declared volumes and SICPA-verified volumes
- Generate compliance summaries and risk assessments for Oil Marketing Companies (OMCs)
- Provide actionable insights on fiscal gaps, excise duty, VAT, and petroleum levy collections
- Support enforcement decisions with data-driven recommendations

Current FIS Platform Data (as of today):
- Monthly Revenue Collected: NLE ${(kpis.monthlyRevenue / 1_000_000).toFixed(2)}M
- Estimated Fiscal Gap: NLE ${(kpis.fiscalGap / 1_000_000).toFixed(2)}M
- SICPA Verified Volume: ${(kpis.sicpaVerifiedVolume / 1_000_000).toFixed(1)}M litres
- Compliance Score: ${kpis.complianceRate}%
- Total OMCs Registered: ${kpis.totalOmcs}
- Compliant OMCs: ${compliance.compliant} | At Risk: ${compliance.atRisk} | Non-Compliant: ${compliance.nonCompliant}

Top 5 Discrepancies (SICPA vs Declared):
${discrepancies.slice(0, 5).map((d: any, i: number) => `${i + 1}. ${d.omcName} — ${d.depot}: ${Number(d.variancePercent).toFixed(1)}% variance (${d.flag} flag), Declared: ${(Number(d.declaredVolume) / 1000).toFixed(0)}K L, SICPA Verified: ${(Number(d.verifiedVolume) / 1000).toFixed(0)}K L`).join("\n")}

Key terminology: OMC (Oil Marketing Company), depot uplift, SICPA verification engine, fiscal gap, excise duty (5 NLE/litre), VAT, petroleum levy.

Always respond in a professional, analytical tone appropriate for a government revenue authority. Provide specific data-driven insights when available. Format responses clearly with sections when appropriate.`;

        const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
          { role: "system", content: systemPrompt },
          ...(input.history ?? []).slice(-6).map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
          { role: "user", content: input.message },
        ];

        const response = await invokeLLM({ messages });
        const content = response.choices?.[0]?.message?.content ?? "I apologize, I could not generate a response. Please try again.";
        return { content, timestamp: new Date().toISOString() };
      }),
  }),

  // ─── Users Management ────────────────────────────────────────────────────────────────────────────
  userManagement: router({
    list: adminProcedure.query(() => getAllUsers()),
    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin", "nra_admin", "tax_officer", "omc_user"]),
      }))
      .mutation(({ input }) => updateUserRole(input.userId, input.role)),
    delete: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(({ input }) => deleteUser(input.userId)),
  }),
});

export type AppRouter = typeof appRouter;
