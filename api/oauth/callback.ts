import "dotenv/config";
import { serialize } from "cookie";
import type { IncomingMessage, ServerResponse } from "node:http";
import { sdk } from "../../server/_core/sdk";
import { upsertUser } from "../../server/db";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";

export default async (req: IncomingMessage & { query: Record<string, string> }, res: ServerResponse) => {
  const url = new URL(req.url || "", `https://${req.headers.host}`);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";

  if (!code || !state) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "code and state are required" }));
    return;
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "openId missing from user info" }));
      return;
    }

    await upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || userInfo.email || userInfo.openId,
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
    console.error("[OAuth] Callback failed", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "OAuth callback failed" }));
  }
};
