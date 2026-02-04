import type { FastifyRequest, FastifyReply } from "fastify";
import type { ErrorResponse } from "../interfaces/error.interface.ts";

export const error404 = (req: FastifyRequest, reply: FastifyReply) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} -> 404`
  );
  reply.status(404).send({
    error: "Not Found",
  });
};

export const globalErrorHandler = (
  err: Error & {
    statusCode?: number;
  },
  request: FastifyRequest,
  reply: FastifyReply
): void => {
  console.error(err.message, err.stack);
  const statusCode: number =
    err.message === "404" ? 404 : err.statusCode || 500;
  const response: ErrorResponse = {
    status: statusCode,
    message: "error",
    data: {
      error_message: err.message === "404" ? "Request not found!" : err.message,
    },
  };

  reply.status(statusCode).send(response);
  return;
};
