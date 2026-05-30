/**
 * Demo authentication route — FOR TESTING PURPOSES ONLY.
 * Allows signing in as a pre-seeded demo user without going through Manus OAuth.
 * Only active when NODE_ENV !== 'production'.
 */
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";

const DEMO_USERS: Record<string, { openId: string; name: string; role: string }> = {
  "demo-admin": {
    openId: "demo-nra-admin-001",
    name: "Admin NRA",
    role: "admin",
  },
  "demo-officer": {
    openId: "demo-tax-officer-001",
    name: "Tax Officer Demo",
    role: "tax_officer",
  },
  "demo-omc": {
    openId: "demo-omc-user-001",
    name: "OMC Portal User",
    role: "omc_user",
  },
};

export function registerDemoAuthRoutes(app: Express) {
  if (process.env.NODE_ENV === "production") {
    // Demo login is disabled in production
    return;
  }

  // GET /api/demo-login?user=demo-admin
  app.get("/api/demo-login", async (req: Request, res: Response) => {
    const userKey = typeof req.query.user === "string" ? req.query.user : "demo-admin";
    const demoUser = DEMO_USERS[userKey];

    if (!demoUser) {
      res.status(400).json({ error: `Unknown demo user. Use: ${Object.keys(DEMO_USERS).join(", ")}` });
      return;
    }

    try {
      // Ensure the demo user exists in DB
      await db.upsertUser({
        openId: demoUser.openId,
        name: demoUser.name,
        email: `${userKey}@nra.gov.sl`,
        loginMethod: "demo",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(demoUser.openId, {
        name: demoUser.name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Demo Auth] Failed", error);
      res.status(500).json({ error: "Demo login failed" });
    }
  });

  console.log("[Demo Auth] Demo login routes registered (DEV only)");
}
