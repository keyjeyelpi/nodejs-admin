import type { FastifyReply, FastifyRequest } from "fastify";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/index.ts";
import { teams, users } from "@/db/schema/index.ts";

type TeamBody = { name?: string; description?: string | null; lead?: string; createdBy?: string };
const pageOf = (request: FastifyRequest) => {
  const query = request.query as { page?: string; limit?: string };
  const page = Math.max(1, Number.parseInt(query.page || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit || "20", 10) || 20));
  return { page, limit, offset: (page - 1) * limit };
};
const userExists = async (id: string) =>
  Boolean((await db.select({ id: users.id }).from(users).where(eq(users.id, id)))[0]);

export const listTeams = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page, limit, offset } = pageOf(request);
    const [counts, data] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(teams),
      db.select().from(teams).limit(limit).offset(offset),
    ]);
    const total = Number(counts[0]?.count || 0);
    return reply.send({ data, total, page, limit, pageTotal: Math.ceil(total / limit) });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ message: "Server error" });
  }
};
export const getTeam = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const [data] = await db.select().from(teams).where(eq(teams.id, request.params.id));
    return data ? reply.send({ data }) : reply.status(404).send({ message: "Team not found" });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ message: "Server error" });
  }
};
export const createTeam = async (
  request: FastifyRequest<{ Body: TeamBody }>,
  reply: FastifyReply
) => {
  const { name, description, lead, createdBy } = request.body;
  if (!name?.trim() || !lead || !createdBy)
    return reply.status(400).send({ message: "Name, lead, and createdBy are required" });
  try {
    if (!(await userExists(lead)) || !(await userExists(createdBy)))
      return reply.status(404).send({ message: "Lead or creator user not found" });
    const id = crypto.randomUUID();
    await db.insert(teams).values({
      id,
      name: name.trim(),
      ...(description !== undefined ? { description } : {}),
      lead,
      createdBy,
    });
    const [data] = await db.select().from(teams).where(eq(teams.id, id));
    return reply.status(201).send({ data });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ message: "Server error" });
  }
};
export const updateTeam = async (
  request: FastifyRequest<{ Params: { id: string }; Body: TeamBody }>,
  reply: FastifyReply
) => {
  const { name, description, lead, createdBy } = request.body;
  if (name !== undefined && !name.trim())
    return reply.status(400).send({ message: "Name cannot be empty" });
  try {
    if (!(await db.select({ id: teams.id }).from(teams).where(eq(teams.id, request.params.id)))[0])
      return reply.status(404).send({ message: "Team not found" });
    if ((lead && !(await userExists(lead))) || (createdBy && !(await userExists(createdBy))))
      return reply.status(404).send({ message: "Lead or creator user not found" });
    await db
      .update(teams)
      .set({
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(lead !== undefined ? { lead } : {}),
        ...(createdBy !== undefined ? { createdBy } : {}),
      })
      .where(eq(teams.id, request.params.id));
    const [data] = await db.select().from(teams).where(eq(teams.id, request.params.id));
    return reply.send({ data });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ message: "Server error" });
  }
};
export const deleteTeam = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    if (!(await db.select({ id: teams.id }).from(teams).where(eq(teams.id, request.params.id)))[0])
      return reply.status(404).send({ message: "Team not found" });
    await db.delete(teams).where(eq(teams.id, request.params.id));
    return reply.status(204).send();
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ message: "Server error" });
  }
};
