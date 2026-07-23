import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { signature } from "../middleware/signature.middleware.ts";
import {
  createUser,
  deleteUser,
  getListUsers,
  getUserById,
  updateUser,
  getUserLocations,
} from "../controllers/users.controller.ts";

interface QueryParams {
  page?: string;
  limit?: string;
  sortOrder?: string;
  sortBy?: string;
}

const usersRoutes = async (fastify: FastifyInstance) => {
  fastify.get<{ Querystring: QueryParams }>("/", { preHandler: [authenticateJWT] }, getListUsers);

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
