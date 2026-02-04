import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { signature } from "../middleware/signature.middleware.ts";
import {
  createUser,
  deleteUser,
  fetchAllUsers,
  fetchUserByAccountID,
  updateUser,
} from "../controllers/user.controller.ts";

interface QueryParams {
  page?: string;
  limit?: string;
  sortOrder?: string;
  sortBy?: string;
}

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: QueryParams }>(
    "/",
    { preHandler: [authenticateJWT] },
    fetchAllUsers
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [authenticateJWT] },
    fetchUserByAccountID
  );

  fastify.post<{ Body: any }>(
    "/",
    { preHandler: [authenticateJWT, signature] },
    createUser
  );

  fastify.put<{ Params: { user_id: string }; Body: any }>(
    "/:user_id",
    { preHandler: [authenticateJWT, signature] },
    updateUser
  );

  fastify.delete<{ Params: { user_id: string } }>(
    "/:user_id",
    { preHandler: [authenticateJWT, signature] },
    deleteUser
  );
}
