import express from "express";
import {
    createUserController,
    getAllUsersController,
    getUserByIdController,
    updateUserController,
    deleteUserController,
} from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// All user management routes require a valid JWT
router.post(
    "/",
    authenticate,
    authorize("studio_admin", "super_admin"),
    createUserController
);

router.get(
    "/",
    authenticate,
    authorize("studio_admin", "super_admin"),
    getAllUsersController
);

router.get("/:id", authenticate, getUserByIdController);   // Any logged-in user can view a profile

router.put(
    "/:id",
    authenticate,
    authorize("studio_admin", "super_admin"),
    updateUserController
);

router.delete(
    "/:id",
    authenticate,
    authorize("studio_admin", "super_admin"),
    deleteUserController
);

export default router;
