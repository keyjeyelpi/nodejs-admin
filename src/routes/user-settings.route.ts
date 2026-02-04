import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { signature } from "../middleware/signature.middleware.ts";

export default async function userSettingsRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [authenticateJWT, signature] }, async (req, reply) => {
    return { message: "User settings" };
  });

  fastify.put<{ Params: { user_id: string } }>(
    "/:user_id",
    { preHandler: [authenticateJWT, signature] },
    async (req, reply) => {
      return { message: "Update user settings" };
    }
  );

  fastify.delete<{ Params: { user_id: string } }>(
    "/:user_id",
    { preHandler: [authenticateJWT, signature] },
    async (req, reply) => {
      return { message: "Delete user settings" };
    }
  );
}
