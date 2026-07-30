import type { FastifyRequest, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { toCamelCase } from "@/utils/case-converter.util.ts";
import { logUserAction } from "@/utils/logger.util.ts";
import {
  users,
  userPositions,
  positions,
  positionRoles,
  roles,
  rolePermissions,
  permissions,
} from "@/db/schema/index.ts";

const getCurrentUserId = (req: FastifyRequest): string => {
  return (req as any).user?.sub || "unknown";
};

type PositionEntry = {
  id: string;
  name: string;
  description: string;
};

type RoleEntry = {
  id: string;
  name: string;
  description: string;
  module: string | null;
};

export const getUserById = async (
  req: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) => {
  console.log("getUserById accessed");

  const { id } = req.params;

  try {
    const rows = await db
      .select({
        // User fields
        id: users.id,
        country: users.country,
        lastname: users.lastname,
        firstname: users.firstname,
        email: users.email,
        username: users.username,
        contactnumber: users.contactnumber,
        active: users.active,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        // Position fields
        positionId: positions.id,
        positionName: positions.name,
        positionDescription: positions.description,
        // Role fields
        roleId: roles.id,
        roleName: roles.name,
        roleDescription: roles.description,
        roleModule: roles.module,
        // Permission fields
        permissionKey: permissions.key,
      })
      .from(users)
      .leftJoin(userPositions, eq(userPositions.userId, users.id))
      .leftJoin(positions, eq(userPositions.positionId, positions.id))
      .leftJoin(positionRoles, eq(positionRoles.positionId, positions.id))
      .leftJoin(roles, eq(positionRoles.roleId, roles.id))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(users.id, id));

    const [base, ...rest] = rows;

    if (!base) return reply.status(404).send({ message: "User not found" });

    const allRows = [base, ...rest];

    const positionMap = new Map<string, PositionEntry>();
    const roleMap = new Map<string, RoleEntry>();
    const permissionSet = new Set<string>();

    for (const row of allRows) {
      if (row.positionId && row.positionName && row.positionDescription) {
        if (!positionMap.has(row.positionId)) {
          positionMap.set(row.positionId, {
            id: row.positionId,
            name: row.positionName,
            description: row.positionDescription,
          });
        }
      }

      if (row.roleId && row.roleName && row.roleDescription) {
        if (!roleMap.has(row.roleId)) {
          roleMap.set(row.roleId, {
            id: row.roleId,
            name: row.roleName,
            description: row.roleDescription,
            module: row.roleModule ?? null,
          });
        }
      }

      if (row.permissionKey) {
        permissionSet.add(row.permissionKey);
      }
    }

    const cleanedUser = {
      id: base.id,
      country: base.country,
      lastname: base.lastname,
      firstname: base.firstname,
      email: base.email,
      username: base.username,
      contactnumber: base.contactnumber,
      active: base.active,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
      positions: [...positionMap.values()],
      roles: [...roleMap.values()],
      permissions: [...permissionSet],
    };

    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "getUserById",
      req,
    });

    // await new Promise(resolve => setTimeout(resolve, 1000));

    return reply.status(200).send({
      message: `Get user with ID ${id}`,
      data: toCamelCase(cleanedUser),
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};
