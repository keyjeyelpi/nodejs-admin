import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { fetchAllAccounts } from "../controllers/roles.controller.ts";

const rolesRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/", { preHandler: [authenticateJWT] }, fetchAllAccounts);
}

export default rolesRoutes;
