import type { FastifyInstance } from "fastify";
import authRoutes from "@/routes/auth.route.ts";
import dashboardRoutes from "@/routes/dashboard.route.ts";
import rolesRoutes from "@/routes/roles.route.ts";
import positionsRoutes from "@/routes/positions.route.ts";
import permissionsRoutes from "@/routes/permissions.route.ts";
import usersRoutes from "@/routes/users.route.ts";
import userSettingsRoutes from "@/routes/user-settings.route.ts";
import wsRoutes from "@/routes/ws.route.ts";
import { error404, globalErrorHandler } from "@/controllers/index.ts";

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
  fastify.register(wsRoutes, {
    prefix: "/web-socket",
  });

  // 404 handler
  fastify.setNotFoundHandler(error404);
  // Global error handler
  fastify.setErrorHandler(globalErrorHandler);
};

export default routes;
