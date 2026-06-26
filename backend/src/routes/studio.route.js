import express from "express";
import {
    registerStudioController,
    getAllStudiosController,
    getStudioByIdController,
    updateStudioController,
    deleteStudioController,
} from "../controllers/studio.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post("/register", registerStudioController);   // Create studio + admin user
router.get("/", getAllStudiosController);              // List all studios
router.get("/:id", getStudioByIdController);          // Get single studio

// ── Protected (must be logged in + must be studio_admin) ─────────────────────
router.put(
    "/:id",
    authenticate,
    authorize("studio_admin", "super_admin"),
    updateStudioController
);

router.delete(
    "/:id",
    authenticate,
    authorize("studio_admin", "super_admin"),
    deleteStudioController
);

export default router;