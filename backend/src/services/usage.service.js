import { AppDataSource } from "../config/data-source.js";
import { ApiUsageCounter } from "../models/ApiUsageCounter.js";

// ─────────────────────────────────────────────────────────────────────────────
// Lightweight per-studio API request counter. Increments are buffered in
// memory and flushed to the DB on an interval so this never adds latency or
// a DB round-trip to the hot request path.
// ─────────────────────────────────────────────────────────────────────────────

const buffer = new Map(); // key: `${studioId}:${YYYY-MM-DD}` -> { requestCount, errorCount }

const todayKey = () => new Date().toISOString().slice(0, 10);

const bump = (studioId, isError) => {
    const key = `${studioId}:${todayKey()}`;
    const entry = buffer.get(key) || { studioId, date: todayKey(), requestCount: 0, errorCount: 0 };
    entry.requestCount += 1;
    if (isError) entry.errorCount += 1;
    buffer.set(key, entry);
};

export const flushUsageBuffer = async () => {
    if (!buffer.size || !AppDataSource.isInitialized) return;
    const repo = AppDataSource.getRepository(ApiUsageCounter);
    const entries = Array.from(buffer.values());
    buffer.clear();

    for (const entry of entries) {
        try {
            const existing = await repo.findOne({ where: { studioId: entry.studioId, date: entry.date } });
            if (existing) {
                existing.requestCount += entry.requestCount;
                existing.errorCount += entry.errorCount;
                await repo.save(existing);
            } else {
                await repo.save(repo.create(entry));
            }
        } catch (error) {
            console.error("Usage counter flush failed for", entry, error.message);
        }
    }
};

// Flush every 30s; also flushed once on graceful shutdown (see server.js)
let flushTimer = null;
export const startUsageFlushInterval = () => {
    if (flushTimer) return;
    flushTimer = setInterval(() => flushUsageBuffer().catch(() => {}), 30_000);
    flushTimer.unref?.();
};

// Applied globally in server.js, near the top of the middleware stack — reads
// req.user which is populated later by each router's own `authenticate`
// middleware, since the increment happens on the `finish` event (after the
// whole request/response cycle has completed).
export const trackUsage = (req, res, next) => {
    res.on("finish", () => {
        const studioId = req.user?.studioId;
        if (!studioId) return; // platform admin, public routes, or unauthenticated request
        bump(studioId, res.statusCode >= 400);
    });
    next();
};

// ── Reads for the Super Admin dashboard ───────────────────────────────────
export const getUsageForStudio = async (studioId, { days = 30 } = {}) => {
    const repo = AppDataSource.getRepository(ApiUsageCounter);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);

    const rows = await repo
        .createQueryBuilder("u")
        .where("u.studioId = :studioId", { studioId })
        .andWhere("u.date >= :sinceStr", { sinceStr })
        .orderBy("u.date", "ASC")
        .getMany();

    const totalRequests = rows.reduce((sum, r) => sum + r.requestCount, 0);
    const totalErrors = rows.reduce((sum, r) => sum + r.errorCount, 0);
    return { days: rows, totalRequests, totalErrors };
};

export const getUsageForAllStudios = async ({ days = 30 } = {}) => {
    const repo = AppDataSource.getRepository(ApiUsageCounter);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);

    const rows = await repo
        .createQueryBuilder("u")
        .select("u.studioId", "studioId")
        .addSelect("SUM(u.requestCount)", "totalRequests")
        .addSelect("SUM(u.errorCount)", "totalErrors")
        .where("u.date >= :sinceStr", { sinceStr })
        .groupBy("u.studioId")
        .getRawMany();

    return rows.map((r) => ({
        studioId: r.studioId,
        totalRequests: Number(r.totalRequests) || 0,
        totalErrors: Number(r.totalErrors) || 0,
    }));
};
