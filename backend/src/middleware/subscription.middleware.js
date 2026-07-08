import { getStudioSubscription, isSubscriptionUsable, planHasFeature } from "../services/subscription.service.js";

// Applied to studio-scoped routers right after `authenticate`. Blocks access
// once a studio's trial has expired or its subscription/status is otherwise
// unusable (past the grace status, or manually suspended by Super Admin).
// Billing-related endpoints (viewing/choosing a plan) are intentionally NOT
// behind this middleware so a studio can always get to the upgrade screen.
export const checkSubscriptionActive = async (req, res, next) => {
    try {
        const studioId = req.user?.studioId;
        if (!studioId) return next(); // platform-admin or unscoped route — not our concern here

        const subscription = await getStudioSubscription(studioId);
        req.studioSubscription = subscription; // cache for downstream handlers/middleware

        if (!isSubscriptionUsable(subscription)) {
            const reason = subscription?.suspendedByAdmin
                ? (subscription.suspendedReason || "This studio's account has been suspended.")
                : "Your trial or subscription has ended. Please upgrade your plan to continue.";
            return res.status(402).json({ message: reason, code: "SUBSCRIPTION_INACTIVE" });
        }

        return next();
    } catch (error) {
        console.error("checkSubscriptionActive error:", error.message);
        return next(); // fail-open on infra errors — never take a studio offline due to our own bug
    }
};

// Factory: gates a route/router behind a specific plan feature flag, e.g.
//   router.use(requireFeature("aiBookingAssistant"))
export const requireFeature = (featureKey) => async (req, res, next) => {
    try {
        const studioId = req.user?.studioId;
        if (!studioId) return next();

        const subscription = req.studioSubscription || (await getStudioSubscription(studioId));
        req.studioSubscription = subscription;

        if (!planHasFeature(subscription, featureKey)) {
            return res.status(403).json({
                message: "This feature isn't included in your current plan. Please upgrade to unlock it.",
                code: "FEATURE_NOT_IN_PLAN",
                feature: featureKey,
            });
        }
        return next();
    } catch (error) {
        console.error("requireFeature error:", error.message);
        return res.status(500).json({ message: "Could not verify plan access." });
    }
};
