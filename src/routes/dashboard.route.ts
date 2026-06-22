import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { getUserDashboard } from "../controllers/dashboard.controller.ts";

const dashboardRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/users", { preHandler: [authenticateJWT] }, getUserDashboard);
};

export default dashboardRoutes;
