import express from "express";
import {
    getMyWebsiteController,
    updateMyWebsiteController,
    generateController,
    themesController,
    getBlocksController,
    saveBlocksController,
    setDomainController,
    removeDomainController,
    verifyDomainController,
} from "../controllers/website.controller.js";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import { checkSubscriptionActive, requireFeature } from "../middleware/subscription.middleware.js";

const router = express.Router();

// Website Builder / Online Booking Website / Custom Branding are all
// Free-Trial-and-Premium-only features per the SaaS plan table — gate the
// entire router behind one flag since Basic & Professional are false for
// all three anyway.
router.use(authenticate, checkSubscriptionActive, requireFeature("websiteBuilder"));

router.get("/themes", themesController);
router.get("/", requirePermission("website:manage"), getMyWebsiteController);
router.put("/", requirePermission("website:manage"), updateMyWebsiteController);
router.post("/generate", requirePermission("website:manage"), generateController);

// Page builder (drag & drop blocks)
router.get("/blocks", requirePermission("website:manage"), getBlocksController);
router.put("/blocks", requirePermission("website:manage"), saveBlocksController);

// Custom domain
router.post("/domain", requirePermission("website:manage"), setDomainController);
router.delete("/domain", requirePermission("website:manage"), removeDomainController);
router.post("/domain/verify", requirePermission("website:manage"), verifyDomainController);

export default router;
