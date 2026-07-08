import { EntitySchema } from "typeorm";

// ─────────────────────────────────────────────────────────────────────────────
// StudioSubscription — one row per studio, linking it to a SubscriptionPlan
// and tracking its billing/trial state. Super Admin can override discounts,
// extra purchased seats, and status per studio directly.
// ─────────────────────────────────────────────────────────────────────────────

export const StudioSubscription = new EntitySchema({
    name: "StudioSubscription",
    tableName: "studio_subscriptions",

    columns: {
        id: { primary: true, type: "int", generated: true },

        studioId: { type: "int", nullable: false, unique: true },
        planId: { type: "int", nullable: false },

        // trialing | active | past_due | canceled | expired
        status: { type: "varchar", default: "trialing", nullable: false },

        trialEndsAt: { type: "datetime", nullable: true },
        currentPeriodStart: { type: "datetime", nullable: true },
        currentPeriodEnd: { type: "datetime", nullable: true },

        // Extra seats purchased beyond the plan's included maxUsers, and the
        // per-seat overage price locked in at time of purchase (falls back to
        // the plan's/env default if null).
        extraUserSlots: { type: "int", default: 0 },
        overagePricePerUserOverride: { type: "decimal", precision: 10, scale: 2, nullable: true },

        // Per-studio discount override set by Super Admin (in addition to /
        // instead of the plan's own discount)
        discountPercentOverride: { type: "decimal", precision: 5, scale: 2, nullable: true },
        discountFlatAmountOverride: { type: "decimal", precision: 10, scale: 2, nullable: true },
        discountNote: { type: "varchar", nullable: true },

        cancelAtPeriodEnd: { type: "bit", default: 0 },
        suspendedByAdmin: { type: "bit", default: 0 }, // Super Admin manual suspend, independent of billing status
        suspendedReason: { type: "varchar", nullable: true },

        createdAt: { type: "datetime", createDate: true },
        updatedAt: { type: "datetime", updateDate: true },
    },

    relations: {
        studio: {
            type: "many-to-one",
            target: "Studio",
            joinColumn: { name: "studioId" },
            nullable: false,
        },
        plan: {
            type: "many-to-one",
            target: "SubscriptionPlan",
            joinColumn: { name: "planId" },
            nullable: false,
        },
    },
});
