import type { FastifyReply, FastifyRequest } from "fastify";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { departments, users } from "@/db/schema/index.ts";

type DepartmentBody = { name?: string; description?: string | null; lead?: string };
const pageOf = (request: FastifyRequest) => {
  const query = request.query as { page?: string; limit?: string };
  const page = Math.max(1, Number.parseInt(query.page || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit || "20", 10) || 20));
  return { page, limit, offset: (page - 1) * limit };
};

export const listDepartments = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page, limit, offset } = pageOf(request);
    const [counts, data] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(departments),
      db.select().from(departments).limit(limit).offset(offset),
    ]);
    const total = Number(counts[0]?.count || 0);
    return reply.send({ data, total, page, limit, pageTotal: Math.ceil(total / limit) });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ message: "Server error" });
  }
};

export const getDepartment = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const [data] = await db.select().from(departments).where(eq(departments.id, request.params.id));
    return data
      ? reply.send({ data })
      : reply.status(404).send({ message: "Department not found" });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ message: "Server error" });
  }
};

export const createDepartment = async (
  request: FastifyRequest<{ Body: DepartmentBody }>,
  reply: FastifyReply
) => {
  const { name, description, lead } = request.body;
  if (!name?.trim() || !lead)
    return reply.status(400).send({ message: "Name and lead are required" });
  try {
    if (!(await db.select({ id: users.id }).from(users).where(eq(users.id, lead)))[0])
      return reply.status(404).send({ message: "Lead user not found" });
    const id = crypto.randomUUID();
    await db.insert(departments).values({
      id,
      name: name.trim(),
      ...(description !== undefined ? { description } : {}),
      lead,
    });
    const [data] = await db.select().from(departments).where(eq(departments.id, id));
    return reply.status(201).send({ data });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ message: "Server error" });
  }
};

export const updateDepartment = async (
  request: FastifyRequest<{ Params: { id: string }; Body: DepartmentBody }>,
  reply: FastifyReply
) => {
  const { name, description, lead } = request.body;
  if (name !== undefined && !name.trim())
    return reply.status(400).send({ message: "Name cannot be empty" });
  try {
    if (
      !(
        await db
          .select({ id: departments.id })
          .from(departments)
          .where(eq(departments.id, request.params.id))
      )[0]
    )
      return reply.status(404).send({ message: "Department not found" });
    if (lead && !(await db.select({ id: users.id }).from(users).where(eq(users.id, lead)))[0])
      return reply.status(404).send({ message: "Lead user not found" });
    await db
      .update(departments)
      .set({
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(lead !== undefined ? { lead } : {}),
      })
      .where(eq(departments.id, request.params.id));
    const [data] = await db.select().from(departments).where(eq(departments.id, request.params.id));
    return reply.send({ data });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ message: "Server error" });
  }
};

export const deleteDepartment = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    if (
      !(
        await db
          .select({ id: departments.id })
          .from(departments)
          .where(eq(departments.id, request.params.id))
      )[0]
    )
      return reply.status(404).send({ message: "Department not found" });
    await db.delete(departments).where(eq(departments.id, request.params.id));
    return reply.status(204).send();
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ message: "Server error" });
  }
};
