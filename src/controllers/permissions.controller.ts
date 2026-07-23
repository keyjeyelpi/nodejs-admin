import type { FastifyRequest, FastifyReply } from "fastify";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import { permissions, rolePermissions } from "../db/schema/index.ts";
import { logUserAction } from "../utils/logger.util.ts";

const getCurrentUserId = (req: FastifyRequest): string => {
  return (req as any).user?.sub || "unknown";
};

export const getListPermissions = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(query.limit || "10", 10)));
    const offset = (page - 1) * limit;

    const countRows = await db
      .select({ count: sql<number>`count(distinct ${permissions.id})` })
      .from(permissions);

    const total = Number(countRows[0]?.count) || 0;

    const rows = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        key: permissions.key,
        systemGenerated: permissions.systemGenerated,
        roleCount: sql<number>`count(distinct ${rolePermissions.roleId})`,
      })
      .from(permissions)
      .leftJoin(rolePermissions, eq(rolePermissions.permissionId, permissions.id))
      .groupBy(permissions.id, permissions.name, permissions.key, permissions.systemGenerated)
      .limit(limit)
      .offset(offset);

    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "getListPermissions",
      req,
    });

    return reply.status(200).send({
      message: "",
      data: rows,
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

export const getPermissionsById = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;

    const [perm] = await db.select().from(permissions).where(eq(permissions.id, id));

    if (!perm) return reply.status(404).send({ message: "Permission not found" });

    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "getPermissionsById",
      req,
    });

    return reply.status(200).send({
      message: "",
      data: perm,
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const createPermissions = async (
  req: FastifyRequest<{
    Body: {
      name: string;
      key: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { name, key } = req.body;

    if (!name || !key) return reply.status(400).send({ message: "Name and key are required" });

    const id = crypto.randomUUID();

    await db.insert(permissions).values({
      id,
      name,
      key,
      systemGenerated: false,
    });

    const [createPermissionsd] = await db.select().from(permissions).where(eq(permissions.id, id));

    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "createPermissions",
      req,
    });

    return reply.status(201).send({
      message: "Permission createPermissionsd successfully",
      data: createPermissionsd,
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const updatePermissions = async (
  req: FastifyRequest<{
    Params: { id: string };
    Body: {
      name?: string;
      key?: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params;
    const { name, key } = req.body;

    const [existing] = await db.select().from(permissions).where(eq(permissions.id, id));

    if (!existing) return reply.status(404).send({ message: "Permission not found" });

    const updatePermissionsData: Record<string, unknown> = {};
    if (name !== undefined) updatePermissionsData.name = name;
    if (key !== undefined) updatePermissionsData.key = key;

    if (Object.keys(updatePermissionsData).length > 0) {
      await db.update(permissions).set(updatePermissionsData).where(eq(permissions.id, id));
    }

    const [updatePermissionsd] = await db.select().from(permissions).where(eq(permissions.id, id));

    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "updatePermissions",
      req,
    });

    return reply.status(200).send({
      message: "Permission updatePermissionsd successfully",
      data: updatePermissionsd,
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

    const [existing] = await db.select().from(permissions).where(eq(permissions.id, id));

    if (!existing) return reply.status(404).send({ message: "Permission not found" });

    if (existing.systemGenerated)
      return reply.status(400).send({
        message: "Cannot deletePermissions a system-generated permission",
      });

    await db.delete(permissions).where(eq(permissions.id, id));

    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "remove",
      req,
    });

    return reply.status(200).send({
      message: "Permission deletePermissionsd successfully",
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};
