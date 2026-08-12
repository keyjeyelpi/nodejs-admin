import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "@/middleware/jwt.middleware.ts";
import { getListPositions } from "@/controllers/setups/positions/list.positions.ts";
import { getPositionById } from "@/controllers/setups/positions/id.positions.ts";
import { createPosition } from "@/controllers/setups/positions/create.positions.ts";
import { updatePosition } from "@/controllers/setups/positions/update.positions.ts";
import { deletePosition } from "@/controllers/setups/positions/delete.positions.ts";

const positionsRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/", { preHandler: [authenticateJWT] }, getListPositions);
  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authenticateJWT] },
    getPositionById
  );
  fastify.post<{ Body: { name?: string; description?: string } }>(
    "/",
    { preHandler: [authenticateJWT] },
    createPosition
  );
  fastify.put<{ Params: { id: string }; Body: { name?: string; description?: string } }>(
    "/:id",
    { preHandler: [authenticateJWT] },
    updatePosition
  );
  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authenticateJWT] },
    deletePosition
  );
};

export default positionsRoutes;
