import express from "express";
import * as ctrl from "../controllers/contact.controller.js";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import { checkSubscriptionActive } from "../middleware/subscription.middleware.js";

const router = express.Router();

router.use(authenticate, checkSubscriptionActive);
router.get("/analytics", requirePermission("inquiries:view"), ctrl.analytics);
router.get("/", requirePermission("inquiries:view"), ctrl.getAll);
router.put("/:id", requirePermission("inquiries:manage"), ctrl.update);
router.delete("/:id", requirePermission("inquiries:manage"), ctrl.remove);

export default router;
