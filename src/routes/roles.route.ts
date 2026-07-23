import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import {
  getListRoles,
  getRoles,
  createRoles,
  updateRoles,
  remove,
} from "../controllers/roles.controller.ts";

const rolesRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/", { preHandler: [authenticateJWT] }, getListRoles);

  fastify.get<{
    Params: {
      id: string;
    };
  }>("/:id", { preHandler: [authenticateJWT] }, getRoles);

  fastify.post<{ Body: any }>("/", { preHandler: [authenticateJWT] }, createRoles);

  fastify.put<{
    Params: {
      id: string;
    };
    Body: any;
  }>("/:id", { preHandler: [authenticateJWT] }, updateRoles);

  fastify.delete<{
    Params: {
      id: string;
    };
  }>("/:id", { preHandler: [authenticateJWT] }, remove);
};

export default rolesRoutes;
