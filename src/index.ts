/*
Available Status Codes:
2xx Success
  200 - Standard response for successful HTTP requests
  201 - The request has been fulfilled [Add, Update, Delete]
  204 - The server successfully processed the request, and is not returning any content

4xx Client Errors
  400 - Bad request
  401 - Similar to 403 Forbidden, but specifically for use when authentication is required and has failed or has not yet been provided
  403 - Forbidden Request, The request contained valid data and was understood by the server, but the server is refusing action
  404 - The requested resource could not be found
  405 - A request method is not supported for the requested resource; for example, a GET request on a form that requires data to be presented via POST, or a PUT request on a read-only resource
  410 - Indicates that the resource requested was previously in use but is no longer available and will not be available again.
  412 - The server does not meet one of the preconditions that the requester put on the request header fields
  498 - Invalid Token
  499 - Token Required

5xx Server Errors
  521 - Web Server is Down  
  522 - Connection Time Out
  524 - A Timeout Occured
  599 - MySQL Syntax Error
*/

import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { 
  type Request,
  type Response,
  type NextFunction 
} from "express";
import helmet from "helmet";

import userRoutes from "./routes/user.ts";
import type { ErrorResponse } from "./interface/error.ts";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Enable CORS
app.use(cors({
  origin: "*",
}));

// Middleware
app.use(express.json());
app.use(helmet());

// Routes
app.use("/books", userRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → 404`);
  res.status(404).json({ error: "Not Found" });
});

// Error handler
app.use((err: Error & {statusCode?: number;}, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.message, err.stack);
  const statusCode: number = err.message == "404" ? 404 : err.statusCode || 500;
  const response: ErrorResponse = {
    status: statusCode,
    message: "error",
    data: {
      error_message: err.message == "404" ? "Request not found!" : err.message,
    },
  };
  res.status(statusCode).json(response);
  return;
});


// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});