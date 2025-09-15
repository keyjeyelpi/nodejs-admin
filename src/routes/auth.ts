import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

// In-memory "users" (for demo only, replace with DB)
const users: { id: number; email: string; password: string }[] = [];
let userIdCounter = 1;

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Register
router.post("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = { id: userIdCounter++, email, password: hashedPassword };
  users.push(newUser);

  res.status(201).json({ message: "User registered", user: { id: newUser.id, email: newUser.email } });
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });

  res.json({ message: "Login successful", token });
});

export default router;
