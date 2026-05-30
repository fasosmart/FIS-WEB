import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createNraContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "nra-admin-test",
      email: "admin@nra.gov.sl",
      name: "NRA Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated users", async () => {
    const ctx = createNraContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.role).toBe("admin");
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const clearedCookies: string[] = [];
    const ctx: TrpcContext = {
      ...createNraContext(),
      res: {
        clearCookie: (name: string) => { clearedCookies.push(name); },
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies.length).toBe(1);
  });
});

describe("dashboard.kpis", () => {
  it("returns KPI data for authenticated users", async () => {
    const ctx = createNraContext();
    const caller = appRouter.createCaller(ctx);
    const kpis = await caller.dashboard.kpis();
    expect(kpis).toBeDefined();
    expect(typeof kpis.monthlyRevenue).toBe("number");
    expect(typeof kpis.fiscalGap).toBe("number");
    expect(typeof kpis.complianceRate).toBe("number");
    expect(typeof kpis.totalOmcs).toBe("number");
  }, 15000);
});

describe("dashboard.revenueChart", () => {
  it("returns chart data array", async () => {
    const ctx = createNraContext();
    const caller = appRouter.createCaller(ctx);
    const data = await caller.dashboard.revenueChart();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("month");
    expect(data[0]).toHaveProperty("declared");
    expect(data[0]).toHaveProperty("verified");
  });
});

describe("dashboard.topDiscrepancies", () => {
  it("returns top discrepancies array", async () => {
    const ctx = createNraContext();
    const caller = appRouter.createCaller(ctx);
    const data = await caller.dashboard.topDiscrepancies();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("omcName");
    expect(data[0]).toHaveProperty("variancePercent");
  });
});

describe("omcs.list", () => {
  it("returns OMC list for authenticated users", async () => {
    const ctx = createNraContext();
    const caller = appRouter.createCaller(ctx);
    const omcs = await caller.omcs.list();
    expect(Array.isArray(omcs)).toBe(true);
  });

  it("throws UNAUTHORIZED for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.omcs.list()).rejects.toThrow();
  });
});

describe("taxReturns.list", () => {
  it("returns tax returns for authenticated users", async () => {
    const ctx = createNraContext();
    const caller = appRouter.createCaller(ctx);
    const returns = await caller.taxReturns.list();
    expect(Array.isArray(returns)).toBe(true);
  });
});

describe("consignments.list", () => {
  it("returns consignments for authenticated users", async () => {
    const ctx = createNraContext();
    const caller = appRouter.createCaller(ctx);
    const consignments = await caller.consignments.list();
    expect(Array.isArray(consignments)).toBe(true);
  });
});

describe("sicpa.list", () => {
  it("returns SICPA records for authenticated users", async () => {
    const ctx = createNraContext();
    const caller = appRouter.createCaller(ctx);
    const records = await caller.sicpa.list();
    expect(Array.isArray(records)).toBe(true);
  });
});

describe("enforcement.list", () => {
  it("returns enforcement cases for NRA users", async () => {
    const ctx = createNraContext();
    const caller = appRouter.createCaller(ctx);
    const cases = await caller.enforcement.list();
    expect(Array.isArray(cases)).toBe(true);
  });
});

describe("audit.list", () => {
  it("returns audit logs for NRA users", async () => {
    const ctx = createNraContext();
    const caller = appRouter.createCaller(ctx);
    const logs = await caller.audit.list();
    expect(Array.isArray(logs)).toBe(true);
  });
});
