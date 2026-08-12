import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "@/middleware/jwt.middleware.ts";
import { getListPermissions } from "@/controllers/setups/permissions/list.permissions.ts";
import { getPermissionsById } from "@/controllers/setups/permissions/id.permissions.ts";
import { createPermissions } from "@/controllers/setups/permissions/create.permissions.ts";
import { updatePermissions } from "@/controllers/setups/permissions/update.permissions.ts";
import { deletePermission as remove } from "@/controllers/setups/permissions/delete.permissions.ts";

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
