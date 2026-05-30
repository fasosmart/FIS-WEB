import "dotenv/config";
import { serialize } from "cookie";
import type { IncomingMessage, ServerResponse } from "node:http";
import { sdk } from "../server/_core/sdk";
import { upsertUser } from "../server/db";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";

const DEMO_USERS: Record<string, { openId: string; name: string; email: string; role: "admin" | "tax_officer" | "omc_user" }> = {
  "demo-admin": { openId: "demo-nra-admin-001", name: "Admin NRA", email: "demo-admin@nra.gov.sl", role: "admin" },
  "demo-officer": { openId: "demo-tax-officer-001", name: "Tax Officer Demo", email: "demo-officer@nra.gov.sl", role: "tax_officer" },
  "demo-omc": { openId: "demo-omc-user-001", name: "OMC Portal User", email: "demo-omc@nra.gov.sl", role: "omc_user" },
};

export default async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url || "", `https://${req.headers.host}`);
  const userKey = url.searchParams.get("user") || "demo-admin";
  const demoUser = DEMO_USERS[userKey];

  if (!demoUser) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: `Unknown demo user. Use: ${Object.keys(DEMO_USERS).join(", ")}` }));
    return;
  }

  try {
    await upsertUser({
      openId: demoUser.openId,
      name: demoUser.name,
      email: demoUser.email,
      loginMethod: "demo",
      role: demoUser.role,
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(demoUser.openId, {
      name: demoUser.name,
      expiresInMs: ONE_YEAR_MS,
    });

    const forwardedProto = req.headers["x-forwarded-proto"];
    const isHttps = Array.isArray(forwardedProto) ? forwardedProto[0] === "https" : forwardedProto === "https";

    const cookie = serialize(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: isHttps,
      maxAge: ONE_YEAR_MS / 1000,
    });

    res.writeHead(302, { Location: "/", "Set-Cookie": cookie });
    res.end();
  } catch (error) {
    console.error("[Demo Auth] Failed", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Demo login failed" }));
  }
};
