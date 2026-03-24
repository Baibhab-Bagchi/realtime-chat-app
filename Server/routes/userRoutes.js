import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { findUserByEmail } from "../controllers/userController.js";

const router = express.Router();

router.get("/find", authMiddleware, findUserByEmail);

export default router;