import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { signature } from "../middleware/signature.middleware.ts";
import {
  createUser,
  deleteUser,
  fetchAllUsers,
  fetchUserByAccountID,
  updateUser,
} from "../controllers/users.controller.ts";

interface QueryParams {
  page?: string;
  limit?: string;
  sortOrder?: string;
  sortBy?: string;
}

const usersRoutes = async (fastify: FastifyInstance) => {
  fastify.get<{ Querystring: QueryParams }>(
    "/",
    { preHandler: [authenticateJWT] },
    fetchAllUsers
  );

  fastify.get<{
    Params: {
      id: string;
    };
  }>("/:id", { preHandler: [authenticateJWT] }, fetchUserByAccountID);

  fastify.post<{ Body: any }>(
    "/",
    { preHandler: [authenticateJWT, signature] },
    createUser
  );

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
}

export default usersRoutes;