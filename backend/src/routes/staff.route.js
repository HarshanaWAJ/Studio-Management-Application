import express from "express";
import {
    listStaffController,
    getStaffController,
    inviteStaffController,
    updateStaffController,
    updateStaffRoleController,
    updateStaffPermissionsController,
    updateStaffStatusController,
    removeStaffController,
    resendInviteController,
    rolesAndPermissionsController,
} from "../controllers/staff.controller.js";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import { checkSubscriptionActive } from "../middleware/subscription.middleware.js";

const router = express.Router();

router.use(authenticate, checkSubscriptionActive);

// Metadata for building the role/permission UI — any authenticated staff member can read
router.get("/meta/roles-permissions", rolesAndPermissionsController);

router.get("/", requirePermission("staff:view"), listStaffController);
router.get("/:id", requirePermission("staff:view"), getStaffController);

router.post("/invite", requirePermission("staff:invite"), inviteStaffController);
router.post("/:id/resend-invite", requirePermission("staff:invite"), resendInviteController);

router.put("/:id", requirePermission("staff:manage"), updateStaffController);
router.put("/:id/role", requirePermission("staff:manage"), updateStaffRoleController);
router.put("/:id/permissions", requirePermission("staff:manage"), updateStaffPermissionsController);
router.put("/:id/status", requirePermission("staff:manage"), updateStaffStatusController);

router.delete("/:id", requirePermission("staff:delete"), removeStaffController);

export default router;
