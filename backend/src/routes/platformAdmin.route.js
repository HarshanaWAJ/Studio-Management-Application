import express from "express";
import { authenticatePlatform } from "../middleware/platformAuth.middleware.js";
import {
    loginController,
    meController,
    changePasswordController,
    listStudiosController,
    getStudioController,
    setStudioActiveController,
    setStudioSuspendedController,
    assignPlanController,
    setExtraSeatsController,
    setDiscountController,
    listPlansController,
    getPlanController,
    createPlanController,
    updatePlanController,
    deletePlanController,
    usageOverviewController,
    usageForStudioController,
    systemMetricsController,
    listPlanRequestsController,
    approvePlanRequestController,
    rejectPlanRequestController,
} from "../controllers/platformAdmin.controller.js";

const router = express.Router();

// Public
router.post("/auth/login", loginController); // POST /api/v1/platform/auth/login

// Everything below requires a valid platform-scoped token (see
// platformAuth.middleware.js) — a studio user's token is cryptographically
// incapable of passing this check, since it's signed with a different secret.
router.use(authenticatePlatform);

router.get("/auth/me", meController);
router.post("/auth/change-password", changePasswordController);

// Studios — account metadata, subscription, and usage ONLY (no client/
// booking/gallery/invoice data — see platformAdmin.service.js STUDIO_ACCOUNT_COLUMNS)
router.get("/studios", listStudiosController);
router.get("/studios/:studioId", getStudioController);
router.patch("/studios/:studioId/status", setStudioActiveController);       // { isActive }
router.patch("/studios/:studioId/suspend", setStudioSuspendedController);   // { suspended, reason }
router.patch("/studios/:studioId/plan", assignPlanController);              // { plan: "premium" | 3 }
router.patch("/studios/:studioId/extra-seats", setExtraSeatsController);    // { extraUserSlots }
router.patch("/studios/:studioId/discount", setDiscountController);        // { discountPercentOverride, discountFlatAmountOverride, discountNote }
router.get("/studios/:studioId/usage", usageForStudioController);

// Plans (4 SaaS tiers) — pricing, discounts, user limits, feature flags
router.get("/plans", listPlansController);
router.get("/plans/:planId", getPlanController);
router.post("/plans", createPlanController);
router.patch("/plans/:planId", updatePlanController);
router.delete("/plans/:planId", deletePlanController);

// Platform-wide usage & resource metrics
router.get("/usage", usageOverviewController);
router.get("/system-metrics", systemMetricsController);

// Plan Requests
router.get("/plan-requests", listPlanRequestsController);
router.post("/plan-requests/:requestId/approve", approvePlanRequestController);
router.post("/plan-requests/:requestId/reject", rejectPlanRequestController);

export default router;
