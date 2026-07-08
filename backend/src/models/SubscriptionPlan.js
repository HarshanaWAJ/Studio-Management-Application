import { EntitySchema } from "typeorm";

// ─────────────────────────────────────────────────────────────────────────────
// SubscriptionPlan — the SaaS pricing tiers (Free Trial / Basic / Professional
// / Premium). Fully configurable from the Super Admin dashboard: pricing,
// discounts, user limits, and per-feature access flags. Seeded with sensible
// defaults on first boot (see services/plan.service.js -> seedDefaultPlans).
// ─────────────────────────────────────────────────────────────────────────────

export const SubscriptionPlan = new EntitySchema({
    name: "SubscriptionPlan",
    tableName: "subscription_plans",

    columns: {
        id: { primary: true, type: "int", generated: true },

        // Stable machine key, e.g. "free_trial" | "basic" | "professional" | "premium"
        key: { type: "varchar", unique: true, nullable: false },

        name: { type: "varchar", nullable: false },        // "Basic"
        tagline: { type: "varchar", nullable: true },       // marketing one-liner

        // ── Pricing ──────────────────────────────────────────────────────
        priceMonthly: { type: "decimal", precision: 10, scale: 2, default: 0 },
        currency: { type: "varchar", default: "USD" },

        // ── Discounts (super admin configurable, applies at checkout/renewal) ─
        discountPercent: { type: "decimal", precision: 5, scale: 2, default: 0 },   // e.g. 10.00 = 10% off
        discountFlatAmount: { type: "decimal", precision: 10, scale: 2, default: 0 }, // flat $ off
        discountLabel: { type: "varchar", nullable: true },  // e.g. "Launch Offer"
        discountActive: { type: "bit", default: 0 },

        // ── Trial ────────────────────────────────────────────────────────
        isTrial: { type: "bit", default: 0 },
        trialDays: { type: "int", default: 0 },

        // ── Seats / overage ──────────────────────────────────────────────
        // null/0 = unlimited (used for the trial plan)
        maxUsers: { type: "int", nullable: true },
        // $ charged per extra user/month beyond maxUsers. If null, the
        // platform-wide DEFAULT_OVERAGE_PRICE_PER_USER env value is used.
        overagePricePerUser: { type: "decimal", precision: 10, scale: 2, nullable: true },
        // If false, exceeding maxUsers is hard-blocked instead of billed as overage.
        allowOverage: { type: "bit", default: 0 },

        // ── Feature flags (JSON) ─────────────────────────────────────────
        // {
        //   studioManagement, customerManagement, staffManagement,
        //   appointmentScheduling, basicBooking, aiBookingAssistant,
        //   automatedReminders, reportsAnalytics, websiteBuilder,
        //   onlineBookingWebsite, customBranding, prioritySupport
        // }
        features: { type: "text", nullable: false },

        sortOrder: { type: "int", default: 0 },
        isActive: { type: "bit", default: 1 },

        createdAt: { type: "datetime", createDate: true },
        updatedAt: { type: "datetime", updateDate: true },
    },
});
