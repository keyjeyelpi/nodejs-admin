import type { FastifyInstance } from "fastify";
import rolesRoutes from "./roles.route.ts";
import authRoutes from "./auth.route.ts";
import kanbanRoutes from "./kanban.route.ts";
import usersRoutes from "./users.route.ts";
import userSettingsRoutes from "./user-settings.route.ts";
import { error404, globalErrorHandler } from "../controllers/index.ts";

export default async function routes(fastify: FastifyInstance) {
  fastify.register(rolesRoutes, {
    prefix: "/roles",
  });
  fastify.register(authRoutes, {
    prefix: "/auth",
  });
  fastify.register(kanbanRoutes, {
    prefix: "/kanban",
  });
  fastify.register(usersRoutes, {
    prefix: "/users",
  });
  fastify.register(userSettingsRoutes, {
    prefix: "/users/:user_id/settings",
  });

  // 404 handler
  fastify.setNotFoundHandler(error404);
  // Global error handler
  fastify.setErrorHandler(globalErrorHandler);
}
