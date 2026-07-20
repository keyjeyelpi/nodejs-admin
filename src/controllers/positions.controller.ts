import type { FastifyRequest, FastifyReply } from "fastify";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  positions,
  positionRoles,
  roles,
  rolePermissions,
  permissions,
} from "../db/schema/index.ts";
import { logUserAction } from "../utils/logger.util.ts";

const getCurrentUserId = (req: FastifyRequest): string => {
  return (req as any).user?.sub || "unknown";
};

export const getList = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const rows = await db
      .select({
        id: positions.id,
        name: positions.name,
        description: positions.description,
        systemGenerated: positions.systemGenerated,
        roleName: roles.name,
        permissionKey: permissions.key,
      })
      .from(positions)
      .leftJoin(positionRoles, eq(positionRoles.positionId, positions.id))
      .leftJoin(roles, eq(positionRoles.roleId, roles.id))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id));

    // Aggregate roles and permissions per position
    const positionMap = new Map<
      string,
      {
        id: string;
        name: string;
        description: string;
        systemGenerated: boolean;
        roles: Set<string>;
        permissions: Set<string>;
      }
    >();

    for (const row of rows) {
      if (!positionMap.has(row.id)) {
        positionMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          systemGenerated: row.systemGenerated,
          roles: new Set(),
          permissions: new Set(),
        });
      }

      const entry = positionMap.get(row.id)!;

      if (row.roleName) {
        entry.roles.add(row.roleName);
      }

      if (row.permissionKey) {
        entry.permissions.add(row.permissionKey);
      }
    }

    const result = Array.from(positionMap.values()).map(
      ({ id, roles, permissions, ...rest }) => ({
        ...rest,
        roles: [...roles],
        permissions: [...permissions],
      })
    );

    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "getList",
      req,
    });

    return reply.status(200).send({
      message: "",
      data: result,
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};
