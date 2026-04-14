import type { FastifyInstance } from "fastify";
import { signature } from "../middleware/signature.middleware.ts";
import {
  login,
  token,
  logout,
  cleanupExpiredTokens,
  revalidate,
} from "../controllers/auth.controller.ts";

const authRoutes = async (fastify: FastifyInstance) => {
  fastify.post<{
    Body: {
      username?: string;
      password?: string;
    };
  }>("/login", { preHandler: [signature] }, login);

  fastify.post<{
    Body: {
      token?: string;
    };
  }>("/refresh", { preHandler: [signature] }, token);

  fastify.post<{
    Body: {
      token?: string;
    };
  }>("/logout", { preHandler: [signature] }, logout);

  fastify.get("/cleanup", { preHandler: [signature] }, cleanupExpiredTokens);

  fastify.get("/revalidate", { preHandler: [signature] }, revalidate);
};

export default authRoutes;
