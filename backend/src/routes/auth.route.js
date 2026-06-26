import express from "express";
import {
    loginController,
    refreshController,
    meController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public
router.post("/login", loginController);       // POST /api/v1/auth/login
router.post("/refresh", refreshController);   // POST /api/v1/auth/refresh

// Protected
router.get("/me", authenticate, meController); // GET  /api/v1/auth/me

export default router;
