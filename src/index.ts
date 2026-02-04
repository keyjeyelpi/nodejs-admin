import process from "node:process";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import fastify from "fastify";
import fastifyHelmet from "@fastify/helmet";
import routes from "./routes/index.ts";

dotenv.config();
const app = fastify({
  logger: true,
});
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Register CORS
    await app.register(cors, {
      origin: "*",
    });

    // Register Helmet
    await app.register(fastifyHelmet);

    // Register routes
    await app.register(routes);

    await app.listen({ port: Number(PORT) });
    console.log(`✅ Server running at http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
