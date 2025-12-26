import dotenv from "dotenv";
import type { Request, Response, NextFunction } from "express";
import { decrypt, encrypt } from "../utils/encryption.util.ts";

dotenv.config();

export const signature = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body) {
    return res.status(400).json({ message: "Request body is missing" });
  }
  
  const { signature, ...body } = req.body;

  const predefinedSignature = Object.values(body)
    .map((v) => JSON.stringify(v))
    .join("");

  const errorResponse = (msg: string) =>
    res.status(400).json({
      message: msg,
      signature:
        process.env.NODE_ENV === "development"
          ? encrypt(predefinedSignature)
          : undefined,
    });

  if (!signature) return errorResponse("Signature is required");

  if (decrypt(signature) !== predefinedSignature)
    return errorResponse("Invalid signature");

  next();
};
