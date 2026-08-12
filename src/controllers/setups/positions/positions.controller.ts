import type { FastifyRequest, FastifyReply } from "fastify";
import { eq, sql, and } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { positions, positionRoles, rolePermissions, userPositions } from "@/db/schema/index.ts";
import { logUserAction } from "@/utils/logger.util.ts";

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

export const getPositionById = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const [position] = await db.select().from(positions).where(eq(positions.id, req.params.id));
    if (!position) return reply.status(404).send({ message: "Position not found" });
    return reply.status(200).send({ data: position });
  } catch (error) {
    req.log.error(error);
    return reply.status(500).send({ message: "Server error" });
  }
};

export const createPosition = async (
  req: FastifyRequest<{ Body: { name?: string; description?: string } }>,
  reply: FastifyReply
) => {
  const { name, description } = req.body;
  if (!name?.trim() || !description?.trim())
    return reply.status(400).send({ message: "Name and description are required" });
  try {
    const id = crypto.randomUUID();
    await db.insert(positions).values({ id, name: name.trim(), description: description.trim() });
    const [position] = await db.select().from(positions).where(eq(positions.id, id));
    return reply.status(201).send({ data: position });
  } catch (error) {
    req.log.error(error);
    return reply.status(400).send({ message: "Unable to create position" });
  }
};

export const updatePosition = async (
  req: FastifyRequest<{ Params: { id: string }; Body: { name?: string; description?: string } }>,
  reply: FastifyReply
) => {
  const { name, description } = req.body;
  if ((name !== undefined && !name.trim()) || (description !== undefined && !description.trim()))
    return reply.status(400).send({ message: "Name and description cannot be empty" });
  try {
    const [existing] = await db.select().from(positions).where(eq(positions.id, req.params.id));
    if (!existing) return reply.status(404).send({ message: "Position not found" });
    if (existing.systemGenerated)
      return reply.status(400).send({ message: "Cannot modify a system-generated position" });
    await db
      .update(positions)
      .set({
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
      })
      .where(eq(positions.id, req.params.id));
    const [position] = await db.select().from(positions).where(eq(positions.id, req.params.id));
    return reply.status(200).send({ data: position });
  } catch (error) {
    req.log.error(error);
    return reply.status(400).send({ message: "Unable to update position" });
  }
};

export const deletePosition = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const [position] = await db.select().from(positions).where(eq(positions.id, req.params.id));
    if (!position) return reply.status(404).send({ message: "Position not found" });
    if (position.systemGenerated)
      return reply.status(400).send({ message: "Cannot delete a system-generated position" });
    await db.delete(positions).where(eq(positions.id, req.params.id));
    return reply.status(204).send();
  } catch (error) {
    req.log.error(error);
    return reply.status(500).send({ message: "Server error" });
  }
};
