import { getStudioSubscription, computeEffectivePrice, createPlanRequest, getPlanRequestsForStudio } from "../services/subscription.service.js";
import { listPlans } from "../services/plan.service.js";

const handle = (res, status, body) => res.status(status).json(body);
const wrap = (fn) => async (req, res) => {
    try {
        return await fn(req, res);
    } catch (error) {
        return handle(res, error.status || 500, { message: error.message || "Something went wrong." });
    }
};

// GET /api/v1/subscription/me — the calling studio's current plan/status
export const getMySubscriptionController = wrap(async (req, res) => {
    const subscription = await getStudioSubscription(req.user.studioId);
    if (!subscription) return handle(res, 404, { message: "No subscription found for this studio." });
    return handle(res, 200, { ...subscription, effectivePriceMonthly: computeEffectivePrice(subscription) });
});

// GET /api/v1/subscription/plans — public-to-logged-in-users pricing catalogue
export const listPublicPlansController = wrap(async (req, res) => {
    const plans = await listPlans({ includeInactive: false });
    return handle(res, 200, plans);
});

// POST /api/v1/subscription/request-upgrade { plan }
export const requestPlanUpgradeController = wrap(async (req, res) => {
    const { plan } = req.body;
    if (!plan) return handle(res, 400, { message: "plan (key) is required." });
    const request = await createPlanRequest(req.user.studioId, plan);
    return handle(res, 201, request);
});

// GET /api/v1/subscription/requests
export const listMyPlanRequestsController = wrap(async (req, res) => {
    const requests = await getPlanRequestsForStudio(req.user.studioId);
    return handle(res, 200, requests);
});

