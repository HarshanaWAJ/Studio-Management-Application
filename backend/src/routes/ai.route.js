import express from "express";
import {
    statusController,
    parseBookingController,
    suggestSlotsController,
    recommendPackageController,
    checkConflictsController,
} from "../controllers/ai.controller.js";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import { checkSubscriptionActive, requireFeature } from "../middleware/subscription.middleware.js";

const router = express.Router();

router.use(authenticate, checkSubscriptionActive);

router.get("/status", statusController);
// "AI Booking Assistant" is a plan-gated feature (Free Trial / Professional / Premium only)
router.post("/parse-booking", requirePermission("bookings:manage"), requireFeature("aiBookingAssistant"), parseBookingController);
router.post("/suggest-slots", requirePermission("bookings:view"), suggestSlotsController);
router.post("/recommend-package", requirePermission("bookings:manage"), requireFeature("aiBookingAssistant"), recommendPackageController);
router.post("/check-conflicts", requirePermission("bookings:view"), checkConflictsController);

export default router;
