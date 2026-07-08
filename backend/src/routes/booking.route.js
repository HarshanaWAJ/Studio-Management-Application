import express from "express";
import * as ctrl from "../controllers/booking.controller.js";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import { checkSubscriptionActive } from "../middleware/subscription.middleware.js";

const router = express.Router();

router.use(authenticate, checkSubscriptionActive);
router.get("/",       requirePermission("bookings:view"),   ctrl.getAll);
router.get("/:id",    requirePermission("bookings:view"),   ctrl.getById);
router.post("/",      requirePermission("bookings:manage"), ctrl.create);
router.put("/:id",    requirePermission("bookings:manage"), ctrl.update);
router.delete("/:id", requirePermission("bookings:cancel"), ctrl.remove);

export default router;
