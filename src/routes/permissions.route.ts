import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import {
  getListPermissions,
  getPermissionsById,
  createPermissions,
  updatePermissions,
  remove,
} from "../controllers/permissions.controller.ts";

const permissionsRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/", { preHandler: [authenticateJWT] }, getListPermissions);

  fastify.get<{
    Params: {
      id: string;
    };
  }>("/:id", { preHandler: [authenticateJWT] }, getPermissionsById);

  fastify.post<{ Body: any }>("/", { preHandler: [authenticateJWT] }, createPermissions);

  fastify.put<{
    Params: {
      id: string;
    };
    Body: any;
  }>("/:id", { preHandler: [authenticateJWT] }, updatePermissions);

  fastify.delete<{
    Params: {
      id: string;
    };
  }>("/:id", { preHandler: [authenticateJWT] }, remove);
};

export default permissionsRoutes;
