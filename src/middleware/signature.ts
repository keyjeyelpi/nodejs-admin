import dotenv from "dotenv";
import type { Request, Response, NextFunction } from "express";
import { decrypt, encrypt } from "../utils/crypto-js.ts";

dotenv.config();

export const signature = (req: Request, res: Response, next: NextFunction) => {
    const { signature, ...body } = req.body;

    const predefinedSignature = Object.values(body).map((v)=>JSON.stringify(v)).join('');

    if(!signature) {
        return res.status(400).json({ 
            message: "Signature is required", 
            signature: process.env.NODE_ENV === 'development' ? encrypt(predefinedSignature) : undefined 
        });
    }

    if (decrypt(signature) !== predefinedSignature) {
        return res.status(400).json({ 
            message: "Invalid signature", 
            signature: process.env.NODE_ENV === 'development' ? encrypt(predefinedSignature) : undefined 
        });
    }

    next();
}