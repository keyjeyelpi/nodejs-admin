import { Router, type Request, type Response } from "express";
import { authenticateJWT } from "../middleware/jwt.ts";

const router = Router();

// GET /users
router.get("/", authenticateJWT, (req: Request, res: Response) => {
  res.status(200).json({ message: "Get all users" });
});

// GET /users/:id
router.get("/:id", authenticateJWT, (req: Request, res: Response) => {
  const { id } = req.params;
  res.status(200).json({ message: `Get user with ID ${id}` });
});

// POST /users
router.post("/", authenticateJWT, (req: Request, res: Response) => {
  const newUser = req.body;
  res.status(201).json({ message: "User created", data: newUser });
});

// PUT /users/:id
router.put("/:id", authenticateJWT, (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedUser = req.body;
  res.status(200).json({ message: `User with ID ${id} updated`, data: updatedUser });
});

// DELETE /users/:id
router.delete("/:id", authenticateJWT, (req: Request, res: Response) => {
  const { id } = req.params;
  res.status(200).json({ message: `User with ID ${id} deleted` });
});

export default router;
