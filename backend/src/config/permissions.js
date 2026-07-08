// ─────────────────────────────────────────────────────────────────────────────
// Central RBAC configuration.
// Every permission string is "<module>:<action>". Roles map to a default set
// of permissions; individual staff members can also get extra permissions
// (or have some revoked) via the `permissions` JSON override stored on User.
// ─────────────────────────────────────────────────────────────────────────────

export const PERMISSIONS = [
    // Staff & studio
    "staff:view", "staff:invite", "staff:manage", "staff:delete",
    "studio:manage", "studio:settings",

    // Customers / CRM
    "clients:view", "clients:manage",

    // Bookings
    "bookings:view", "bookings:manage", "bookings:cancel",

    // Billing
    "invoices:view", "invoices:manage",
    "quotations:view", "quotations:manage",
    "packages:view", "packages:manage",

    // Assets
    "equipment:view", "equipment:manage",
    "inventory:view", "inventory:manage",
    "frames:view", "frames:manage",

    // Media
    "galleries:view", "galleries:manage",

    // Reports & website
    "reports:view",
    "website:manage",

    // Contact-us leads / inquiries
    "inquiries:view", "inquiries:manage",

    // Marketing / comms
    "marketing:manage",
    "notifications:manage",
];

// ── Default permission sets per role ──────────────────────────────────────────
export const ROLE_PERMISSIONS = {
    super_admin: [...PERMISSIONS], // platform owner — everything, across studios

    studio_admin: [...PERMISSIONS], // full control within their own studio

    manager: [
        "staff:view", "staff:invite", "staff:manage",
        "clients:view", "clients:manage",
        "bookings:view", "bookings:manage", "bookings:cancel",
        "invoices:view", "invoices:manage",
        "quotations:view", "quotations:manage",
        "packages:view", "packages:manage",
        "equipment:view", "equipment:manage",
        "inventory:view", "inventory:manage",
        "frames:view", "frames:manage",
        "galleries:view", "galleries:manage",
        "reports:view",
        "marketing:manage",
        "notifications:manage",
        "inquiries:view", "inquiries:manage",
    ],

    receptionist: [
        "clients:view", "clients:manage",
        "bookings:view", "bookings:manage",
        "invoices:view",
        "quotations:view",
        "packages:view",
        "galleries:view",
        "inquiries:view", "inquiries:manage",
    ],

    photographer: [
        "clients:view",
        "bookings:view",
        "galleries:view", "galleries:manage",
        "equipment:view",
    ],

    editor: [
        "galleries:view", "galleries:manage",
        "clients:view",
    ],

    accountant: [
        "invoices:view", "invoices:manage",
        "quotations:view", "quotations:manage",
        "reports:view",
    ],

    staff: [
        // generic baseline for any staff member not fitting the above
        "clients:view",
        "bookings:view",
        "galleries:view",
    ],
};

export const ROLES = Object.keys(ROLE_PERMISSIONS);

// Roles that are allowed to manage other staff members (invite / edit / remove)
export const STAFF_MANAGER_ROLES = ["super_admin", "studio_admin", "manager"];

/**
 * Resolve the effective permission set for a user: role defaults merged
 * with any per-user overrides (`grant` adds, `revoke` removes).
 * overrides shape: { grant?: string[], revoke?: string[] }
 */
export const resolvePermissions = (role, overrides) => {
    const base = new Set(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.staff);

    if (overrides) {
        let parsed = overrides;
        if (typeof overrides === "string") {
            try { parsed = JSON.parse(overrides); } catch { parsed = {}; }
        }
        (parsed.grant || []).forEach((p) => base.add(p));
        (parsed.revoke || []).forEach((p) => base.delete(p));
    }

    return Array.from(base);
};

export const hasPermission = (permissions, required) =>
    Array.isArray(permissions) && permissions.includes(required);
