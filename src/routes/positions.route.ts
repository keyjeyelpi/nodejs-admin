import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { getList } from "../controllers/positions.controller.ts";

const positionsRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/", { preHandler: [authenticateJWT] }, getList);
};

export default positionsRoutes;
