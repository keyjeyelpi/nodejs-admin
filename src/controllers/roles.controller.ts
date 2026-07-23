import type { FastifyRequest, FastifyReply } from "fastify";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  roles,
  rolePermissions,
  permissions,
  positionRoles,
  userPositions,
  users,
} from "../db/schema/index.ts";
import { logUserAction } from "../utils/logger.util.ts";

const getCurrentUserId = (req: FastifyRequest): string => {
  return (req as any).user?.sub || "unknown";
};

export const getListRoles = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(query.limit || "10", 10)));
    const offset = (page - 1) * limit;

    const countRows = await db
      .select({ count: sql<number>`count(distinct ${roles.id})` })
      .from(roles);

    const total = Number(countRows[0]?.count) || 0;

    const rows = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        systemGenerated: roles.systemGenerated,
        userIds: sql<string>`group_concat(distinct ${userPositions.userId})`,
        permissionsCount: sql<number>`count(distinct ${rolePermissions.permissionId})`,
        positionsCount: sql<number>`count(distinct ${positionRoles.positionId})`,
      })
      .from(roles)
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(positionRoles, eq(positionRoles.roleId, roles.id))
      .leftJoin(userPositions, eq(userPositions.positionId, positionRoles.positionId))
      .groupBy(roles.id, roles.name, roles.description, roles.systemGenerated)
      .limit(limit)
      .offset(offset);

    const result = rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      systemGenerated: row.systemGenerated,
      usersCount: row.userIds ? new Set(row.userIds.split(",").filter(Boolean)).size : 0,
      permissionsCount: row.permissionsCount,
      positionsCount: row.positionsCount,
    }));

    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "getListRoles",
      req,
    });

    return reply.status(200).send({
      message: "",
      data: result,
      total,
      pageTotal: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const getRoles = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;

    const [role] = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        systemGenerated: roles.systemGenerated,
      })
      .from(roles)
      .where(eq(roles.id, id));

    if (!role) return reply.status(404).send({ message: "Role not found" });

    const permissionRows = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        key: permissions.key,
      })
      .from(rolePermissions)
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, id));

    const userRows = await db
      .select({
        id: users.id,
        firstname: users.firstname,
        lastname: users.lastname,
        email: users.email,
      })
      .from(positionRoles)
      .leftJoin(userPositions, eq(userPositions.positionId, positionRoles.positionId))
      .leftJoin(users, eq(userPositions.userId, users.id))
      .where(eq(positionRoles.roleId, id));

    const uniqueUsers = new Map();
    for (const u of userRows) {
      if (u.id && !uniqueUsers.has(u.id)) {
        uniqueUsers.set(u.id, u);
      }
    }

    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "getRoles",
      req,
    });

    return reply.status(200).send({
      message: "",
      data: {
        ...role,
        permissions: permissionRows.filter((p) => p.id),
        users: [...uniqueUsers.values()],
      },
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const createRoles = async (
  req: FastifyRequest<{
    Body: {
      name: string;
      description: string;
      permissionIds?: string[];
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { name, description, permissionIds } = req.body;

    if (!name || !description)
      return reply.status(400).send({ message: "Name and description are required" });

    const id = crypto.randomUUID();

    await db.insert(roles).values({
      id,
      name,
      description,
      systemGenerated: false,
    });

    if (permissionIds && permissionIds.length > 0) {
      await db.insert(rolePermissions).values(
        permissionIds.map((permissionId) => ({
          roleId: id,
          permissionId,
        }))
      );
    }

    const [createRolesd] = await db.select().from(roles).where(eq(roles.id, id));

    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "createRoles",
      req,
    });

    return reply.status(201).send({
      message: "Role createRolesd successfully",
      data: createRolesd,
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const updateRoles = async (
  req: FastifyRequest<{
    Params: { id: string };
    Body: {
      name?: string;
      description?: string;
      permissionIds?: string[];
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    const { name, description, permissionIds } = req.body;

    const [existing] = await db.select().from(roles).where(eq(roles.id, id));

    if (!existing) return reply.status(404).send({ message: "Role not found" });

    const updateRolesData: Record<string, unknown> = {};
    if (name !== undefined) updateRolesData.name = name;
    if (description !== undefined) updateRolesData.description = description;

    if (Object.keys(updateRolesData).length > 0) {
      await db.update(roles).set(updateRolesData).where(eq(roles.id, id));
    }

    if (permissionIds !== undefined) {
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));

      if (permissionIds.length > 0) {
        await db.insert(rolePermissions).values(
          permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          }))
        );
      }
    }

    const [updateRolesd] = await db.select().from(roles).where(eq(roles.id, id));

    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "updateRoles",
      req,
    });

    return reply.status(200).send({
      message: "Role updateRolesd successfully",
      data: updateRolesd,
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const remove = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;

    const [existing] = await db.select().from(roles).where(eq(roles.id, id));

    if (!existing) return reply.status(404).send({ message: "Role not found" });

    if (existing.systemGenerated)
      return reply.status(400).send({ message: "Cannot deleteRoles a system-generated role" });

    await db.delete(roles).where(eq(roles.id, id));

    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "remove",
      req,
    });

    return reply.status(200).send({
      message: "Role deleteRolesd successfully",
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};
