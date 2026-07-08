import { AppDataSource } from "../config/data-source.js";
import { StudioSubscription } from "../models/StudioSubscription.js";
import { User } from "../models/User.js";
import { PlanRequest } from "../models/PlanRequest.js";
import { getPlanByKey, getPlanById } from "./plan.service.js";

const subRepo = () => AppDataSource.getRepository(StudioSubscription);
const userRepo = () => AppDataSource.getRepository(User);
const requestRepo = () => AppDataSource.getRepository(PlanRequest);

const DEFAULT_OVERAGE_PRICE = () => Number(process.env.DEFAULT_OVERAGE_PRICE_PER_USER || 5);

// Called automatically right after a studio registers (see studio.service.js)
export const assignDefaultTrialPlan = async (studioId) => {
    const repo = subRepo();
    const existing = await repo.findOne({ where: { studioId } });
    if (existing) return existing;

    const trialPlan = await getPlanByKey("free_trial");
    if (!trialPlan) throw new Error("Free Trial plan is not seeded yet.");

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + (trialPlan.trialDays || 30) * 24 * 60 * 60 * 1000);

    const sub = repo.create({
        studioId,
        planId: trialPlan.id,
        status: "trialing",
        trialEndsAt,
        currentPeriodStart: now,
        currentPeriodEnd: trialEndsAt,
    });
    return repo.save(sub);
};

export const getStudioSubscription = async (studioId) => {
    const sub = await subRepo().findOne({ where: { studioId } });
    if (!sub) return null;
    const plan = await getPlanById(sub.planId);
    return { ...sub, plan };
};

// Is the studio's access currently valid (trial not expired / subscription active)?
export const isSubscriptionUsable = (subscription) => {
    if (!subscription) return false;
    if (subscription.suspendedByAdmin) return false;
    if (subscription.status === "trialing") {
        return !subscription.trialEndsAt || new Date(subscription.trialEndsAt) > new Date();
    }
    return subscription.status === "active" || subscription.status === "past_due";
};

// Does the studio's current plan include a given feature?
export const planHasFeature = (subscription, featureKey) => {
    if (!subscription?.plan?.features) return false;
    return !!subscription.plan.features[featureKey];
};

const effectiveOveragePrice = (subscription) => {
    if (subscription.overagePricePerUserOverride != null) return Number(subscription.overagePricePerUserOverride);
    if (subscription.plan?.overagePricePerUser != null) return Number(subscription.plan.overagePricePerUser);
    return DEFAULT_OVERAGE_PRICE();
};

// Hard-enforcement check used by staff.service.js before creating a new user.
// Returns { allowed, reason, limit, current } — never throws itself so the
// caller can decide how to surface it.
export const checkUserLimit = async (studioId) => {
    const subscription = await getStudioSubscription(studioId);
    if (!subscription) {
        return { allowed: false, reason: "This studio has no active subscription." };
    }

    const plan = subscription.plan;
    const maxUsers = plan?.maxUsers; // null/undefined = unlimited (trial)
    if (maxUsers == null) return { allowed: true, unlimited: true };

    const currentCount = await userRepo().count({ where: { studioId, isActive: true } });
    const limit = maxUsers + (subscription.extraUserSlots || 0);

    if (currentCount < limit) {
        return { allowed: true, current: currentCount, limit };
    }

    // Over the limit — plan-level allowOverage decides whether it's billable
    // overage (still blocked here per hard-enforcement policy, but the
    // message differs) or a flat block.
    if (plan.allowOverage) {
        return {
            allowed: false,
            current: currentCount,
            limit,
            reason: `You've reached your plan's user limit (${limit}). Add extra seats at $${effectiveOveragePrice(subscription).toFixed(2)}/user/month, or upgrade your plan.`,
            overagePricePerUser: effectiveOveragePrice(subscription),
            canPurchaseOverage: true,
        };
    }

    return {
        allowed: false,
        current: currentCount,
        limit,
        reason: `You've reached your plan's user limit (${limit}). Please upgrade your plan to add more staff.`,
        canPurchaseOverage: false,
    };
};

// Super Admin: purchase/adjust extra seats for a studio
export const setExtraUserSlots = async (studioId, extraUserSlots) => {
    const repo = subRepo();
    const sub = await repo.findOne({ where: { studioId } });
    if (!sub) throw Object.assign(new Error("Studio has no subscription record."), { status: 404 });
    sub.extraUserSlots = Math.max(0, Number(extraUserSlots) || 0);
    await repo.save(sub);
    return sub;
};

// Super Admin: assign/change a studio's plan
export const assignPlanToStudio = async (studioId, planKeyOrId) => {
    const repo = subRepo();
    let plan = await getPlanByKey(planKeyOrId);
    if (!plan) plan = await getPlanById(planKeyOrId);
    if (!plan) throw Object.assign(new Error("Plan not found."), { status: 404 });

    let sub = await repo.findOne({ where: { studioId } });
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    if (!sub) {
        sub = repo.create({ studioId, planId: plan.id, status: plan.isTrial ? "trialing" : "active" });
    } else {
        sub.planId = plan.id;
        sub.status = plan.isTrial ? "trialing" : "active";
    }
    sub.currentPeriodStart = now;
    sub.currentPeriodEnd = periodEnd;
    if (plan.isTrial) {
        sub.trialEndsAt = new Date(now.getTime() + (plan.trialDays || 30) * 24 * 60 * 60 * 1000);
    }
    await repo.save(sub);
    return sub;
};

// Super Admin: per-studio discount override
export const setStudioDiscount = async (studioId, { discountPercentOverride, discountFlatAmountOverride, discountNote }) => {
    const repo = subRepo();
    const sub = await repo.findOne({ where: { studioId } });
    if (!sub) throw Object.assign(new Error("Studio has no subscription record."), { status: 404 });
    if (discountPercentOverride !== undefined) sub.discountPercentOverride = discountPercentOverride;
    if (discountFlatAmountOverride !== undefined) sub.discountFlatAmountOverride = discountFlatAmountOverride;
    if (discountNote !== undefined) sub.discountNote = discountNote;
    await repo.save(sub);
    return sub;
};

// Super Admin: suspend / reactivate a studio's access (independent of billing)
export const setStudioSuspended = async (studioId, suspended, reason = null) => {
    const repo = subRepo();
    const sub = await repo.findOne({ where: { studioId } });
    if (!sub) throw Object.assign(new Error("Studio has no subscription record."), { status: 404 });
    sub.suspendedByAdmin = !!suspended;
    sub.suspendedReason = suspended ? reason : null;
    await repo.save(sub);
    return sub;
};

// Computes the effective monthly price a studio pays after plan + per-studio discounts
export const computeEffectivePrice = (subscription) => {
    const plan = subscription.plan;
    if (!plan) return 0;
    let price = Number(plan.priceMonthly || 0);

    const pct = subscription.discountPercentOverride != null
        ? Number(subscription.discountPercentOverride)
        : (plan.discountActive ? Number(plan.discountPercent || 0) : 0);
    const flat = subscription.discountFlatAmountOverride != null
        ? Number(subscription.discountFlatAmountOverride)
        : (plan.discountActive ? Number(plan.discountFlatAmount || 0) : 0);

    price = price * (1 - pct / 100) - flat;
    if (subscription.extraUserSlots) {
        price += subscription.extraUserSlots * effectiveOveragePrice(subscription);
    }
    return Math.max(0, Math.round(price * 100) / 100);
};

// ── Plan Requests ────────────────────────────────────────────────────────────

export const createPlanRequest = async (studioId, requestedPlanKey) => {
    const plan = await getPlanByKey(requestedPlanKey);
    if (!plan) throw Object.assign(new Error("Requested plan not found."), { status: 404 });
    
    // Check if there's already a pending request
    const existing = await requestRepo().findOne({ where: { studioId, status: "pending" } });
    if (existing) {
        throw Object.assign(new Error("You already have a pending plan request."), { status: 400 });
    }

    const req = requestRepo().create({ studioId, requestedPlanKey, status: "pending" });
    return requestRepo().save(req);
};

export const getPlanRequestsForStudio = async (studioId) => {
    return requestRepo().find({ where: { studioId }, order: { createdAt: "DESC" } });
};

export const getAllPlanRequests = async () => {
    return requestRepo().find({ 
        relations: { studio: true },
        order: { createdAt: "DESC" }
    });
};

export const approvePlanRequest = async (requestId) => {
    const req = await requestRepo().findOne({ where: { id: requestId } });
    if (!req) throw Object.assign(new Error("Plan request not found."), { status: 404 });
    if (req.status !== "pending") throw Object.assign(new Error("Request is not pending."), { status: 400 });

    // Assign the new plan to the studio
    await assignPlanToStudio(req.studioId, req.requestedPlanKey);

    req.status = "approved";
    return requestRepo().save(req);
};

export const rejectPlanRequest = async (requestId, adminNotes = null) => {
    const req = await requestRepo().findOne({ where: { id: requestId } });
    if (!req) throw Object.assign(new Error("Plan request not found."), { status: 404 });
    if (req.status !== "pending") throw Object.assign(new Error("Request is not pending."), { status: 400 });

    req.status = "rejected";
    if (adminNotes) req.adminNotes = adminNotes;
    return requestRepo().save(req);
};

