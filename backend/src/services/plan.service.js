import { AppDataSource } from "../config/data-source.js";
import { SubscriptionPlan } from "../models/SubscriptionPlan.js";
import { buildFeatureSet } from "../config/features.js";

const planRepo = () => AppDataSource.getRepository(SubscriptionPlan);

const parseFeatures = (plan) => ({
    ...plan,
    features: typeof plan.features === "string" ? JSON.parse(plan.features) : plan.features,
});

// ── Default plan catalogue (matches the SaaS pricing table) ──────────────────
// These are only used to seed the table on first boot — every value here is
// then fully editable from the Super Admin dashboard (price, discounts,
// maxUsers, overage price, and every feature flag).
const DEFAULT_PLANS = [
    {
        key: "free_trial",
        name: "Free Trial",
        tagline: "Try every feature free for 30 days.",
        priceMonthly: 0,
        isTrial: true,
        trialDays: 30,
        maxUsers: null, // unlimited during trial
        allowOverage: false,
        overagePricePerUser: null,
        sortOrder: 0,
        features: buildFeatureSet({
            aiBookingAssistant: true,
            websiteBuilder: true,
            onlineBookingWebsite: true,
            customBranding: true,
            prioritySupport: true,
        }),
    },
    {
        key: "basic",
        name: "Basic",
        tagline: "Everything you need to manage your studio.",
        priceMonthly: 12,
        isTrial: false,
        trialDays: 0,
        maxUsers: 3,
        allowOverage: true,
        overagePricePerUser: 5,
        sortOrder: 1,
        features: buildFeatureSet({
            aiBookingAssistant: false,
            websiteBuilder: false,
            onlineBookingWebsite: false,
            customBranding: false,
            prioritySupport: false,
        }),
    },
    {
        key: "professional",
        name: "Professional",
        tagline: "Grow faster with an AI-powered booking assistant.",
        priceMonthly: 24,
        isTrial: false,
        trialDays: 0,
        maxUsers: 10,
        allowOverage: true,
        overagePricePerUser: 5,
        sortOrder: 2,
        features: buildFeatureSet({
            aiBookingAssistant: true,
            websiteBuilder: false,
            onlineBookingWebsite: false,
            customBranding: false,
            prioritySupport: true,
        }),
    },
    {
        key: "premium",
        name: "Premium",
        tagline: "Build your online presence with a professional website and AI-powered management.",
        priceMonthly: 49,
        isTrial: false,
        trialDays: 0,
        maxUsers: 25,
        allowOverage: true,
        overagePricePerUser: 5,
        sortOrder: 3,
        features: buildFeatureSet({
            aiBookingAssistant: true,
            websiteBuilder: true,
            onlineBookingWebsite: true,
            customBranding: true,
            prioritySupport: true,
        }),
    },
];

// Called once on server boot (see server.js). Idempotent — only inserts
// plans that don't already exist by key, never overwrites Super Admin edits.
export const seedDefaultPlans = async () => {
    const repo = planRepo();
    for (const def of DEFAULT_PLANS) {
        const exists = await repo.findOne({ where: { key: def.key } });
        if (exists) continue;
        await repo.save(repo.create({ ...def, features: JSON.stringify(def.features) }));
        console.log(`Seeded subscription plan: ${def.name}`);
    }
};

export const listPlans = async ({ includeInactive = true } = {}) => {
    const repo = planRepo();
    const where = includeInactive ? {} : { isActive: true };
    const plans = await repo.find({ where, order: { sortOrder: "ASC" } });
    return plans.map(parseFeatures);
};

export const getPlanById = async (id) => {
    const plan = await planRepo().findOne({ where: { id: Number(id) } });
    return plan ? parseFeatures(plan) : null;
};

export const getPlanByKey = async (key) => {
    const plan = await planRepo().findOne({ where: { key } });
    return plan ? parseFeatures(plan) : null;
};

// Super Admin: full editable control over pricing, discounts, user limits, features
export const updatePlan = async (id, updates) => {
    const repo = planRepo();
    const plan = await repo.findOne({ where: { id: Number(id) } });
    if (!plan) throw Object.assign(new Error("Plan not found."), { status: 404 });

    const allowed = [
        "name", "tagline", "priceMonthly", "currency",
        "discountPercent", "discountFlatAmount", "discountLabel", "discountActive",
        "maxUsers", "overagePricePerUser", "allowOverage",
        "trialDays", "sortOrder", "isActive",
    ];
    for (const key of allowed) {
        if (updates[key] !== undefined) plan[key] = updates[key];
    }
    if (updates.features && typeof updates.features === "object") {
        plan.features = JSON.stringify({ ...JSON.parse(plan.features), ...updates.features });
    }

    await repo.save(plan);
    return parseFeatures(plan);
};

export const createPlan = async (data) => {
    const repo = planRepo();
    if (!data.key || !data.name) {
        throw Object.assign(new Error("key and name are required."), { status: 400 });
    }
    const existing = await repo.findOne({ where: { key: data.key } });
    if (existing) throw Object.assign(new Error("A plan with this key already exists."), { status: 409 });

    const plan = repo.create({
        ...data,
        features: JSON.stringify(buildFeatureSet(data.features || {})),
    });
    await repo.save(plan);
    return parseFeatures(plan);
};

export const deletePlan = async (id) => {
    const repo = planRepo();
    const plan = await repo.findOne({ where: { id: Number(id) } });
    if (!plan) throw Object.assign(new Error("Plan not found."), { status: 404 });
    // Soft-delete via isActive rather than hard delete, so studios already on
    // this plan keep working and historical records stay intact.
    plan.isActive = false;
    await repo.save(plan);
    return { message: "Plan deactivated." };
};
