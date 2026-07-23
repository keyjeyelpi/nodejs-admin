import type { FastifyRequest, FastifyReply } from "fastify";
import { eq, sql, and } from "drizzle-orm";
import { db } from "../db/index.ts";
import { positions, positionRoles, rolePermissions, userPositions } from "../db/schema/index.ts";
import { logUserAction } from "../utils/logger.util.ts";

const getCurrentUserId = (req: FastifyRequest): string => {
  return (req as any).user?.sub || "unknown";
};

export const getListPositions = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = req.query as Record<string, string>;
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(query.limit || "10", 10)));
    const offset = (page - 1) * limit;

    const countRows = await db
      .select({ count: sql<number>`count(distinct ${positions.id})` })
      .from(positions);

    const total = Number(countRows[0]?.count) || 0;

    const rows = await db
      .select({
        id: positions.id,
        name: positions.name,
        description: positions.description,
        userCount: sql<number>`count(distinct ${userPositions.userId})`,
        roleCount: sql<number>`count(distinct ${positionRoles.roleId})`,
        permissionCount: sql<number>`count(distinct ${rolePermissions.permissionId})`,
      })
      .from(positions)
      .leftJoin(userPositions, eq(userPositions.positionId, positions.id))
      .leftJoin(positionRoles, eq(positionRoles.positionId, positions.id))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, positionRoles.roleId))
      .groupBy(positions.id, positions.name, positions.description)
      .limit(limit)
      .offset(offset);

    await logUserAction({
      userId: getCurrentUserId(req),
      functionName: "getListPositions",
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
