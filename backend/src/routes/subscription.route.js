import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
    getMySubscriptionController,
    listPublicPlansController,
    requestPlanUpgradeController,
    listMyPlanRequestsController,
} from "../controllers/subscription.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/me", getMySubscriptionController);
router.get("/plans", listPublicPlansController);
router.post("/request-upgrade", requestPlanUpgradeController);
router.get("/requests", listMyPlanRequestsController);

export default router;
