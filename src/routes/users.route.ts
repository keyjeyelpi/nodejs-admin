import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "@/middleware/jwt.middleware.ts";
import { signature } from "@/middleware/signature.middleware.ts";
import { getListUsers } from "@/controllers/users/list.users.ts";
import { getUserById } from "@/controllers/users/id.users.ts";
import { createUser } from "@/controllers/users/create.users.ts";
import { updateUser } from "@/controllers/users/update.users.ts";
import { deleteUser } from "@/controllers/users/delete.users.ts";
import { getUserLocations } from "@/controllers/users/locations.users.ts";
import { getUsersAnalytics } from "@/controllers/users/analytics.users.ts";

interface QueryParams {
  page?: string;
  limit?: string;
  sortOrder?: string;
  sortBy?: string;
}

const usersRoutes = async (fastify: FastifyInstance) => {
  fastify.get<{ Querystring: QueryParams }>("/", { preHandler: [authenticateJWT] }, getListUsers);

  fastify.get("/analytics", { preHandler: [authenticateJWT] }, getUsersAnalytics);

  fastify.get<{
    Params: {
      id: string;
    };
  }>("/:id", { preHandler: [authenticateJWT] }, getUserById);

  fastify.post<{ Body: any }>("/", { preHandler: [authenticateJWT, signature] }, createUser);

  fastify.put<{
    Params: {
      id: string;
    };
    Body: any;
  }>("/:id", { preHandler: [authenticateJWT, signature] }, updateUser);

  fastify.delete<{
    Params: {
      id: string;
    };
  }>("/:id", { preHandler: [authenticateJWT] }, deleteUser);

  fastify.get("/locations", { preHandler: [authenticateJWT] }, getUserLocations);
};

export default usersRoutes;
