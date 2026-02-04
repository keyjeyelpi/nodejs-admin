import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { fetchAllAccounts } from "../controllers/account.controller.ts";

export default async function accountRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [authenticateJWT] }, fetchAllAccounts);
}
