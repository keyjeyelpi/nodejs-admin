import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { getListPositions } from "../controllers/positions.controller.ts";

const positionsRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/", { preHandler: [authenticateJWT] }, getListPositions);
};

export default positionsRoutes;
