import "dotenv/config";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createContext } from "../../server/_core/context";
import { appRouter } from "../../server/routers";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default (req: IncomingMessage, res: ServerResponse) => {
  app(req as any, res as any);
};
