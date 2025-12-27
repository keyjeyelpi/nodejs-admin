import process from "node:process";
import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";

dotenv.config();

export const encrypt = (data: string) =>
  CryptoJS.AES.encrypt(data, process.env.PRISMA_SECRET || "secret").toString();

export const decrypt = (data: string) =>
  CryptoJS.AES.decrypt(data, process.env.PRISMA_SECRET || "secret").toString(
    CryptoJS.enc.Utf8
  );

export const hash = (data?: string) =>
  bcrypt.hash(data || process.env.PRISMA_SECRET || "default-password", 10);
