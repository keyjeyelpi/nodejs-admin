import type { FastifyInstance } from "fastify";
import authRoutes from "./auth.route.ts";
import dashboardRoutes from "./dashboard.route.ts";
import rolesRoutes from "./roles.route.ts";
import positionsRoutes from "./positions.route.ts";
import permissionsRoutes from "./permissions.route.ts";
import usersRoutes from "./users.route.ts";
import userSettingsRoutes from "./user-settings.route.ts";
import { error404, globalErrorHandler } from "../controllers/index.ts";

const routes = async (fastify: FastifyInstance) => {
  fastify.register(authRoutes, {
    prefix: "/auth",
  });
  fastify.register(dashboardRoutes, {
    prefix: "/dashboard",
  });
  fastify.register(rolesRoutes, {
    prefix: "/roles",
  });
  fastify.register(usersRoutes, {
    prefix: "/users",
  });
  fastify.register(userSettingsRoutes, {
    prefix: "/users/:user_id/settings",
  });
  fastify.register(positionsRoutes, {
    prefix: "/positions",
  });
  fastify.register(permissionsRoutes, {
    prefix: "/permissions",
  });

  // 404 handler
  fastify.setNotFoundHandler(error404);
  // Global error handler
  fastify.setErrorHandler(globalErrorHandler);
};

export default routes;
