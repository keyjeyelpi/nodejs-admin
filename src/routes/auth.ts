import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import moment from "moment-timezone";

import { query } from "../config/mysql-db.ts";
import { signature } from "../middleware/signature.ts";
import { LOGIN, REGISTER } from "../sql/auth.ts";
import { decrypt } from "../utils/crypto-js.ts";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "";

// Register
router.post("/register", signature, async (req: Request, res: Response) => {
  const { email, password, firstname, lastname, middlename, address, birthday, username, phone_number, positionid } = req.body;

  try {
    // Bad Request
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Check if user already exists
    const rows: any = await query(
      REGISTER,
      [
        firstname || "",
        lastname || "",
        middlename || "",
        address || "",
        moment(birthday).toDate() || new Date(),
        positionid || "",
        username || "",
        email || "",
        phone_number || "",
        decrypt(password) || "",
        process.env.MYSQL_SECRET || ""
      ]
    );

    // Internal Server Error
    if (rows.affectedRows !== 1) {
      res.status(500).json({ message: "User registration failed" });
      return;
    }

    // Created
    res.status(201).json({ message: "User registered successfully" });
    return;

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err });
  }
});

// Login
router.post("/login", signature, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const decryptedPassword = decrypt(password);

    const rows: any = await query(
      LOGIN,
      [email, email, process.env.MYSQL_SECRET, decryptedPassword]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;
