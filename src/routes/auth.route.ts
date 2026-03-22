import type { FastifyInstance } from "fastify";
import { login, refreshToken } from "../controllers/auth.controller.ts";
import { signature } from "../middleware/signature.middleware.ts";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: { username?: string; password?: string } }>(
    "/login",
    { preHandler: [signature] },
    login
  );

  fastify.post<{ Body: { refreshToken?: string } }>(
    "/refresh",
    { preHandler: [signature] },
    refreshToken
  );
}
