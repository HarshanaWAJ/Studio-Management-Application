import { EntitySchema } from "typeorm";

export const Website = new EntitySchema({
    name: "Website",
    tableName: "websites",
    columns: {
        id:        { primary: true, type: "int", generated: true },
        studioId:  { type: "int", nullable: false, unique: true },

        slug:      { type: "varchar", nullable: false, unique: true },

        // Theme preset id — see frontend/backend THEME_PRESETS list (kept in sync)
        theme:     { type: "varchar", default: "amber-noir" },

        heroTitle:    { type: "varchar", nullable: true },
        heroSubtitle: { type: "varchar", nullable: true },
        heroImageUrl: { type: "varchar", nullable: true },
        logoUrl:      { type: "varchar", nullable: true },
        aboutText:    { type: "text",    nullable: true },
        servicesIntro:{ type: "varchar", nullable: true },
        contactMessage: { type: "varchar", nullable: true },
        seoDescription: { type: "varchar", nullable: true },

        // JSON: { instagram, facebook, tiktok, whatsapp }
        socialLinks: { type: "text", nullable: true },

        // ── Page Builder (WordPress-style, drag & drop) ──────────────────────
        // JSON: ordered array of { id, type, data } blocks. When present, the
        // public site renders from this instead of the legacy fixed layout.
        blocks: { type: "text", nullable: true },

        // ── Booking widget config ─────────────────────────────────────────────
        bookingEnabled: { type: "bit", default: 1 },

        // ── Custom domain ─────────────────────────────────────────────────────
        // status: "none" | "pending" | "verified"
        customDomain:            { type: "varchar", nullable: true, unique: true },
        domainStatus:            { type: "varchar", default: "none" },
        domainVerificationToken: { type: "varchar", nullable: true },
        domainVerifiedAt:        { type: "datetime", nullable: true },

        isPublished: { type: "bit", default: 0 },

        createdAt: { type: "datetime", createDate: true },
        updatedAt: { type: "datetime", updateDate: true },
    },
    relations: {
        studio: { type: "many-to-one", target: "Studio", joinColumn: { name: "studioId" }, nullable: false },
    },
});
