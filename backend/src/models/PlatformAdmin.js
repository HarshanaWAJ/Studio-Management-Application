import { EntitySchema } from "typeorm";

// ─────────────────────────────────────────────────────────────────────────────
// PlatformAdmin — the SaaS "Super Admin" identity. Deliberately kept as a
// completely separate entity/table/auth path from studio Users:
//   • It has no studioId and no relation into any studio's data at all.
//   • Its JWTs carry scope: "platform" and are checked by a dedicated
//     middleware (platformAuth.middleware.js) that none of the studio data
//     routes (clients, bookings, galleries, invoices, etc.) accept.
// This is what makes "Super Admin can manage studios/billing/usage but
// cannot access studio internal data" an architectural guarantee rather
// than just a permission flag that could be misconfigured.
// ─────────────────────────────────────────────────────────────────────────────

export const PlatformAdmin = new EntitySchema({
    name: "PlatformAdmin",
    tableName: "platform_admins",

    columns: {
        id: { primary: true, type: "uuid", generated: "uuid" },
        firstName: { type: "varchar", nullable: false },
        lastName: { type: "varchar", nullable: false },
        email: { type: "varchar", unique: true, nullable: false },
        passwordHash: { type: "varchar", nullable: false },
        isActive: { type: "bit", default: 1, nullable: false },
        createdAt: { type: "datetime", createDate: true },
        updatedAt: { type: "datetime", updateDate: true },
    },
});
