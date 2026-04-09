import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "../middleware/jwt.middleware.ts";
import { signature } from "../middleware/signature.middleware.ts";

const userSettingsRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/", { preHandler: [authenticateJWT, signature] }, async () => ({
    message: "User settings",
  }));

  fastify.put<{
    Params: {
      user_id: string;
    };
  }>("/:user_id", { preHandler: [authenticateJWT, signature] }, async () => ({
    message: "Update user settings",
  }));

  fastify.delete<{
    Params: {
      user_id: string;
    };
  }>("/:user_id", { preHandler: [authenticateJWT, signature] }, async () => ({
    message: "Delete user settings",
  }));
};

export default userSettingsRoutes;
