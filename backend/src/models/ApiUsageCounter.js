import { EntitySchema } from "typeorm";

// ─────────────────────────────────────────────────────────────────────────────
// ApiUsageCounter — one row per (studio, day). Incremented on every
// authenticated API request a studio's users make (see
// middleware/usageTracking.middleware.js). Powers the Super Admin's
// per-studio "API Requests" usage view. Real CPU/RAM is reported separately
// at the whole-server level (see services/systemMetrics.service.js), since
// all studios share one backend process.
// ─────────────────────────────────────────────────────────────────────────────

export const ApiUsageCounter = new EntitySchema({
    name: "ApiUsageCounter",
    tableName: "api_usage_counters",

    columns: {
        id: { primary: true, type: "int", generated: true },
        studioId: { type: "int", nullable: false },
        date: { type: "varchar", nullable: false }, // "YYYY-MM-DD" (UTC)
        requestCount: { type: "int", default: 0, nullable: false },
        errorCount: { type: "int", default: 0, nullable: false },
        createdAt: { type: "datetime", createDate: true },
        updatedAt: { type: "datetime", updateDate: true },
    },

    indices: [
        { name: "IDX_usage_studio_date", columns: ["studioId", "date"], unique: true },
    ],
});
