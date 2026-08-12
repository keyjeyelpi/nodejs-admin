import type { FastifyInstance } from "fastify";
import { authenticateJWT } from "@/middleware/jwt.middleware.ts";
import { listDepartments } from "@/controllers/organization/departments/list.departments.ts";
import { getDepartment } from "@/controllers/organization/departments/id.departments.ts";
import { createDepartment } from "@/controllers/organization/departments/create.departments.ts";
import { updateDepartment } from "@/controllers/organization/departments/update.departments.ts";
import { deleteDepartment } from "@/controllers/organization/departments/delete.departments.ts";
import { listTeams } from "@/controllers/organization/teams/list.teams.ts";
import { getTeam } from "@/controllers/organization/teams/id.teams.ts";
import { createTeam } from "@/controllers/organization/teams/create.teams.ts";
import { updateTeam } from "@/controllers/organization/teams/update.teams.ts";
import { deleteTeam } from "@/controllers/organization/teams/delete.teams.ts";

const organizationRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/departments", { preHandler: [authenticateJWT] }, listDepartments);
  fastify.get<{ Params: { id: string } }>(
    "/departments/:id",
    { preHandler: [authenticateJWT] },
    getDepartment
  );
  fastify.post<{ Body: { name?: string; description?: string | null; lead?: string } }>(
    "/departments",
    { preHandler: [authenticateJWT] },
    createDepartment
  );
  fastify.put<{
    Params: { id: string };
    Body: { name?: string; description?: string | null; lead?: string };
  }>("/departments/:id", { preHandler: [authenticateJWT] }, updateDepartment);
  fastify.delete<{ Params: { id: string } }>(
    "/departments/:id",
    { preHandler: [authenticateJWT] },
    deleteDepartment
  );
  fastify.get("/teams", { preHandler: [authenticateJWT] }, listTeams);
  fastify.get<{ Params: { id: string } }>("/teams/:id", { preHandler: [authenticateJWT] }, getTeam);
  fastify.post<{
    Body: { name?: string; description?: string | null; lead?: string; createdBy?: string };
  }>("/teams", { preHandler: [authenticateJWT] }, createTeam);
  fastify.put<{
    Params: { id: string };
    Body: { name?: string; description?: string | null; lead?: string; createdBy?: string };
  }>("/teams/:id", { preHandler: [authenticateJWT] }, updateTeam);
  fastify.delete<{ Params: { id: string } }>(
    "/teams/:id",
    { preHandler: [authenticateJWT] },
    deleteTeam
  );
};
export default organizationRoutes;
