import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "@/middleware/jwt.middleware.ts";
import { getListRoles } from "@/controllers/setups/roles/list.roles.ts";
import { getRoles } from "@/controllers/setups/roles/id.roles.ts";
import { createRoles } from "@/controllers/setups/roles/create.roles.ts";
import { updateRoles } from "@/controllers/setups/roles/update.roles.ts";
import { deleteRole as remove } from "@/controllers/setups/roles/delete.roles.ts";

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
