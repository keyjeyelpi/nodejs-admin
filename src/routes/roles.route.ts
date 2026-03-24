import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { fetchAllAccounts } from "../controllers/roles.controller.ts";

export default async function rolesRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [authenticateJWT] }, fetchAllAccounts);
}
