import express, { type Request, type Response } from "express";

import type { ErrorResponse } from "../interfaces/error.interface.ts";

import accountRoutes from "../controllers/account.controller.ts";
import authRoutes from "../controllers/auth.controller.ts";
import userRoutes from "../controllers/user.controller.ts";

const app = express();

app.use("/account", accountRoutes);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> 404`
  );
  res.status(404).json({ error: "Not Found" });
});

// Global error handler
app.use(
  (
    err: Error & { statusCode?: number },
    _req: Request,
    res: Response
  ): void => {
    console.error(err.message, err.stack);
    const statusCode: number =
      err.message == "404" ? 404 : err.statusCode || 500;
    const response: ErrorResponse = {
      status: statusCode,
      message: "error",
      data: {
        error_message:
          err.message == "404" ? "Request not found!" : err.message,
      },
    };
    res.status(statusCode).json(response);
    return;
  }
);

export default app;
