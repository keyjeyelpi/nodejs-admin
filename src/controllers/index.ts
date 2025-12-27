import type { Request, Response } from "express";
import type { ErrorResponse } from "../interfaces/error.interface.ts";

export const error404 = (req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> 404`
  );
  res.status(404).json({
    error: "Not Found",
  });
};

export const globalErrorHandler = (
  err: Error & {
    statusCode?: number;
  },
  _req: Request,
  res: Response
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

  res.status(statusCode).json(response);
  return;
};
