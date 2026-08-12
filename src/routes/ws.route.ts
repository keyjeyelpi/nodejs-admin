import type { FastifyInstance } from "fastify";
import { tokenCheckWs } from "@/controllers/ws.controller.ts";

const wsRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/token-check", { websocket: true }, tokenCheckWs);
};

export default wsRoutes;
