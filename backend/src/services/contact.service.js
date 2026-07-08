import { AppDataSource } from "../config/data-source.js";
import { ContactSubmission } from "../models/ContactSubmission.js";

const repo = () => AppDataSource.getRepository(ContactSubmission);

export const listSubmissions = async (studioId, { status, source } = {}) => {
    const where = { studioId };
    if (status) where.status = status;
    if (source) where.source = source;
    return repo().find({ where, order: { createdAt: "DESC" } });
};

export const updateSubmission = async (id, studioId, data) => {
    const item = await repo().findOne({ where: { id: parseInt(id), studioId } });
    if (!item) throw Object.assign(new Error("Submission not found."), { status: 404 });

    const allowed = ["status", "clientId", "bookingId"];
    for (const key of allowed) {
        if (data[key] !== undefined) item[key] = data[key];
    }
    if (data.status && data.status !== "new" && !item.respondedAt) {
        item.respondedAt = new Date();
    }
    return repo().save(item);
};

export const removeSubmission = async (id, studioId) => {
    const item = await repo().findOne({ where: { id: parseInt(id), studioId } });
    if (!item) throw Object.assign(new Error("Submission not found."), { status: 404 });
    await repo().remove(item);
    return { message: "Deleted." };
};

// ── Analytics — can this studio analyze what's coming through Contact Us? ─────
export const getAnalytics = async (studioId) => {
    const all = await repo().find({ where: { studioId } });

    const total = all.length;
    const byStatus = { new: 0, contacted: 0, converted: 0, archived: 0 };
    const bySource = { website: 0, booking_widget: 0, manual: 0 };
    for (const item of all) {
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        bySource[item.source] = (bySource[item.source] || 0) + 1;
    }

    // Last 30 days, submissions per day
    const days = 30;
    const now = new Date();
    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        buckets.push({ date: d.toISOString().slice(0, 10), count: 0 });
    }
    const bucketIndex = new Map(buckets.map((b, i) => [b.date, i]));
    for (const item of all) {
        const key = new Date(item.createdAt).toISOString().slice(0, 10);
        if (bucketIndex.has(key)) buckets[bucketIndex.get(key)].count += 1;
    }

    const converted = byStatus.converted || 0;
    const conversionRate = total > 0 ? Math.round((converted / total) * 1000) / 10 : 0;

    // Average response time (createdAt -> respondedAt) in hours, for responded items
    const responded = all.filter((i) => i.respondedAt);
    const avgResponseHours = responded.length
        ? Math.round(
            (responded.reduce((sum, i) => sum + (new Date(i.respondedAt) - new Date(i.createdAt)), 0) /
                responded.length / 3600000) * 10
        ) / 10
        : null;

    const bookingsFromWidget = all.filter((i) => i.source === "booking_widget" && i.bookingId).length;

    return {
        total,
        byStatus,
        bySource,
        conversionRate,
        avgResponseHours,
        bookingsFromWidget,
        dailySeries: buckets,
    };
};
