import express from "express";
import {
    publicWebsiteController,
    publicWebsiteByDomainController,
    publicInquiryController,
    publicAvailabilityController,
    publicBookController,
    domainCheckController,
} from "../controllers/website.controller.js";

const router = express.Router();

// No authenticate middleware — these power the public-facing studio sites

// Edge-proxy TLS "ask" check — must come before the generic /:slug route
router.get("/domain-check", domainCheckController);
router.get("/by-domain/:domain", publicWebsiteByDomainController);

router.get("/:slug", publicWebsiteController);
router.post("/:slug/inquiry", publicInquiryController);
router.get("/:slug/availability", publicAvailabilityController);
router.post("/:slug/book", publicBookController);

export default router;
