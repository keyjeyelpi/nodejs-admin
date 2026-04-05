import type { FastifyInstance } from "fastify";
import {
  login,
  refreshToken,
  logout,
  cleanupExpiredTokens,
  validateSession,
} from "../controllers/auth.controller.ts";
import { signature } from "../middleware/signature.middleware.ts";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: { username?: string; password?: string } }>(
    "/login",
    { preHandler: [signature] },
    login
  );

  fastify.get(
    "/validate-session",
    { preHandler: [signature] },
    validateSession
  );

  fastify.post<{ Body: { refreshToken?: string } }>(
    "/refresh",
    { preHandler: [signature] },
    refreshToken
  );

  fastify.post<{ Body: { refreshToken?: string } }>(
    "/logout",
    { preHandler: [signature] },
    logout
  );

  fastify.get("/cleanup", { preHandler: [signature] }, cleanupExpiredTokens);
}
