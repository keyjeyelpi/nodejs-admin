import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { userSettings } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const fetchUserSettings = async (
  req: FastifyRequest<{ Params: { user_id: string } }>,
  reply: FastifyReply
) => {
  const { user_id } = req.params;

  try {
    const settings = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, user_id))
      .then(rows => rows[0]);

    if (!settings)
      return reply.status(404).send({
        message: "Settings not found",
      });

    reply.status(200).send({
      message: "",
      data: settings,
    });
  } catch (err) {
    console.error(err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};

export const updateUserSettings = async (
  req: FastifyRequest<{ Params: { user_id: string }; Body: { colorPrimary?: string; colorSecondary?: string; darkModePreference?: string } }>,
  reply: FastifyReply
) => {
  const { user_id } = req.params;
  const { colorPrimary, colorSecondary, darkModePreference } = req.body || {};

  try {
    const updateData: Record<string, unknown> = {};
    if (colorPrimary !== undefined) updateData.colorPrimary = colorPrimary;
    if (colorSecondary !== undefined) updateData.colorSecondary = colorSecondary;
    if (darkModePreference !== undefined) updateData.darkModePreference = darkModePreference;

    await db.update(userSettings)
      .set(updateData)
      .where(eq(userSettings.userId, user_id));

    const updatedSettings = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, user_id))
      .then(rows => rows[0]);

    if (!updatedSettings)
      return reply.status(404).send({
        message: "Settings not found",
      });

    reply.status(200).send({
      message: "Settings updated successfully",
      data: updatedSettings,
    });
  } catch (err) {
    console.error(err);
    reply.status(500).send({
      message: "Server error",
      error: err,
    });
  }
};
