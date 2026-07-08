import { AppDataSource } from "../config/data-source.js";
import { Studio } from "../models/Studio.js";
import { User } from "../models/User.js";
import { getStudioSubscription, computeEffectivePrice } from "./subscription.service.js";
import { getUsageForAllStudios, getUsageForStudio } from "./usage.service.js";

const studioRepo = () => AppDataSource.getRepository(Studio);
const userRepo = () => AppDataSource.getRepository(User);

// Explicit column allow-list — Super Admin only ever sees studio *account*
// metadata (name/contact/status), never client, booking, gallery, invoice,
// or any other internal studio data. This function is the single place
// platform routes read studio rows from, so the boundary lives in one spot.
const STUDIO_ACCOUNT_COLUMNS = {
    id: true, studioName: true, email: true, phone: true,
    address: true, category: true, isActive: true, createdAt: true,
};

export const listStudiosForPlatform = async () => {
    const studios = await studioRepo().find({ select: STUDIO_ACCOUNT_COLUMNS, order: { createdAt: "DESC" } });
    const usageByStudio = await getUsageForAllStudios({ days: 30 });
    const usageMap = new Map(usageByStudio.map((u) => [u.studioId, u]));

    const results = [];
    for (const studio of studios) {
        const subscription = await getStudioSubscription(studio.id);
        const staffCount = await userRepo().count({ where: { studioId: studio.id, isActive: true } });
        const usage = usageMap.get(studio.id) || { totalRequests: 0, totalErrors: 0 };

        results.push({
            ...studio,
            staffCount,
            subscription: subscription
                ? {
                      planKey: subscription.plan?.key,
                      planName: subscription.plan?.name,
                      status: subscription.status,
                      trialEndsAt: subscription.trialEndsAt,
                      currentPeriodEnd: subscription.currentPeriodEnd,
                      extraUserSlots: subscription.extraUserSlots,
                      suspendedByAdmin: subscription.suspendedByAdmin,
                      effectivePriceMonthly: computeEffectivePrice(subscription),
                  }
                : null,
            usage30d: { requests: usage.totalRequests, errors: usage.totalErrors },
        });
    }
    return results;
};

export const getStudioForPlatform = async (studioId) => {
    const studio = await studioRepo().findOne({ where: { id: Number(studioId) }, select: STUDIO_ACCOUNT_COLUMNS });
    if (!studio) throw Object.assign(new Error("Studio not found."), { status: 404 });

    const subscription = await getStudioSubscription(studio.id);
    const staffCount = await userRepo().count({ where: { studioId: studio.id, isActive: true } });
    const usage = await getUsageForStudio(studio.id, { days: 30 });

    return { ...studio, staffCount, subscription, usage };
};

// Account-level enable/disable (independent of billing suspension)
export const setStudioAccountActive = async (studioId, isActive) => {
    const repo = studioRepo();
    const studio = await repo.findOne({ where: { id: Number(studioId) } });
    if (!studio) throw Object.assign(new Error("Studio not found."), { status: 404 });
    studio.isActive = !!isActive;
    await repo.save(studio);
    return { id: studio.id, isActive: studio.isActive };
};
