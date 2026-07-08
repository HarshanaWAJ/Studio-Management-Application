import {
    platformLogin,
    getPlatformAdminById,
    changePlatformAdminPassword,
} from "../services/platformAuth.service.js";
import {
    listStudiosForPlatform,
    getStudioForPlatform,
    setStudioAccountActive,
} from "../services/platformAdmin.service.js";
import {
    assignPlanToStudio,
    setExtraUserSlots,
    setStudioDiscount,
    setStudioSuspended,
    getAllPlanRequests,
    approvePlanRequest,
    rejectPlanRequest,
} from "../services/subscription.service.js";
import { listPlans, getPlanById, createPlan, updatePlan, deletePlan } from "../services/plan.service.js";
import { getUsageForStudio, getUsageForAllStudios } from "../services/usage.service.js";
import { getSystemMetrics } from "../services/systemMetrics.service.js";
import { FEATURE_KEYS, FEATURE_LABELS } from "../config/features.js";

const handle = (res, status, body) => res.status(status).json(body);
const wrap = (fn) => async (req, res) => {
    try {
        return await fn(req, res);
    } catch (error) {
        return handle(res, error.status || 500, { message: error.message || "Something went wrong." });
    }
};

// ── Auth ──────────────────────────────────────────────────────────────────
export const loginController = wrap(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return handle(res, 400, { message: "Email and password are required." });
    const result = await platformLogin(email, password);
    return handle(res, 200, result);
});

export const meController = wrap(async (req, res) => {
    const admin = await getPlatformAdminById(req.platformAdmin.id);
    if (!admin) return handle(res, 404, { message: "Admin not found." });
    return handle(res, 200, admin);
});

export const changePasswordController = wrap(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await changePlatformAdminPassword(req.platformAdmin.id, currentPassword, newPassword);
    return handle(res, 200, result);
});

// ── Studios (metadata + subscription + usage only — no internal data) ──────
export const listStudiosController = wrap(async (req, res) => {
    return handle(res, 200, await listStudiosForPlatform());
});

export const getStudioController = wrap(async (req, res) => {
    return handle(res, 200, await getStudioForPlatform(req.params.studioId));
});

export const setStudioActiveController = wrap(async (req, res) => {
    const { isActive } = req.body;
    return handle(res, 200, await setStudioAccountActive(req.params.studioId, isActive));
});

export const setStudioSuspendedController = wrap(async (req, res) => {
    const { suspended, reason } = req.body;
    return handle(res, 200, await setStudioSuspended(req.params.studioId, suspended, reason));
});

export const assignPlanController = wrap(async (req, res) => {
    const { plan } = req.body; // plan key or id
    if (!plan) return handle(res, 400, { message: "plan (key or id) is required." });
    return handle(res, 200, await assignPlanToStudio(req.params.studioId, plan));
});

export const setExtraSeatsController = wrap(async (req, res) => {
    const { extraUserSlots } = req.body;
    return handle(res, 200, await setExtraUserSlots(req.params.studioId, extraUserSlots));
});

export const setDiscountController = wrap(async (req, res) => {
    return handle(res, 200, await setStudioDiscount(req.params.studioId, req.body));
});

// ── Plans (4 SaaS tiers — fully configurable) ───────────────────────────────
export const listPlansController = wrap(async (req, res) => {
    return handle(res, 200, { plans: await listPlans(), featureKeys: FEATURE_KEYS, featureLabels: FEATURE_LABELS });
});

export const getPlanController = wrap(async (req, res) => {
    const plan = await getPlanById(req.params.planId);
    if (!plan) return handle(res, 404, { message: "Plan not found." });
    return handle(res, 200, plan);
});

export const createPlanController = wrap(async (req, res) => {
    return handle(res, 201, await createPlan(req.body));
});

export const updatePlanController = wrap(async (req, res) => {
    return handle(res, 200, await updatePlan(req.params.planId, req.body));
});

export const deletePlanController = wrap(async (req, res) => {
    return handle(res, 200, await deletePlan(req.params.planId));
});

// ── Usage & system resource metrics ─────────────────────────────────────────
export const usageOverviewController = wrap(async (req, res) => {
    const days = Number(req.query.days) || 30;
    return handle(res, 200, await getUsageForAllStudios({ days }));
});

export const usageForStudioController = wrap(async (req, res) => {
    const days = Number(req.query.days) || 30;
    return handle(res, 200, await getUsageForStudio(req.params.studioId, { days }));
});

export const systemMetricsController = wrap(async (req, res) => {
    return handle(res, 200, getSystemMetrics());
});

// ── Plan Requests ────────────────────────────────────────────────────────────
export const listPlanRequestsController = wrap(async (req, res) => {
    return handle(res, 200, await getAllPlanRequests());
});

export const approvePlanRequestController = wrap(async (req, res) => {
    return handle(res, 200, await approvePlanRequest(req.params.requestId));
});

export const rejectPlanRequestController = wrap(async (req, res) => {
    const { adminNotes } = req.body;
    return handle(res, 200, await rejectPlanRequest(req.params.requestId, adminNotes));
});

