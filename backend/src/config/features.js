// ─────────────────────────────────────────────────────────────────────────────
// Canonical feature-flag keys for SubscriptionPlan.features (stored as JSON).
// Keeping this list in one place means plan.service.js (seeding/validation)
// and middleware/subscription.middleware.js (gating) never drift apart.
// ─────────────────────────────────────────────────────────────────────────────

export const FEATURE_KEYS = [
    "studioManagement",
    "customerManagement",
    "staffManagement",
    "appointmentScheduling",
    "basicBooking",
    "aiBookingAssistant",
    "automatedReminders",
    "reportsAnalytics",
    "websiteBuilder",
    "onlineBookingWebsite",
    "customBranding",
    "prioritySupport",
];

// Human-readable labels for the Super Admin dashboard's plan editor.
export const FEATURE_LABELS = {
    studioManagement: "Studio Management",
    customerManagement: "Customer Management",
    staffManagement: "Staff Management",
    appointmentScheduling: "Appointment Scheduling",
    basicBooking: "Basic Booking System",
    aiBookingAssistant: "AI Booking Assistant",
    automatedReminders: "Automated Reminders",
    reportsAnalytics: "Reports & Analytics",
    websiteBuilder: "Website Builder",
    onlineBookingWebsite: "Online Booking Website",
    customBranding: "Custom Branding",
    prioritySupport: "Priority Support",
};

// Features that are core to every plan (including paid tiers) and are never
// meant to be turned off — kept here mainly for documentation/validation.
export const ALWAYS_ON_FEATURES = [
    "studioManagement",
    "customerManagement",
    "staffManagement",
    "appointmentScheduling",
    "basicBooking",
    "automatedReminders",
    "reportsAnalytics",
];

export const buildFeatureSet = (overrides = {}) => {
    const all = {};
    for (const key of FEATURE_KEYS) all[key] = false;
    for (const key of ALWAYS_ON_FEATURES) all[key] = true;
    return { ...all, ...overrides };
};
