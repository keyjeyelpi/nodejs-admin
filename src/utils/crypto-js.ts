import CryptoJS from "crypto-js";
import dotenv from "dotenv";

dotenv.config();

export const encrypt = (data: string) =>
  CryptoJS.AES.encrypt(data, process.env.MYSQL_SECRET || "your_password").toString();

export const decrypt = (data: string) =>
  CryptoJS.AES.decrypt(data, process.env.MYSQL_SECRET || "your_password" ).toString(CryptoJS.enc.Utf8);
