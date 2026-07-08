import crypto from "crypto";
import dns from "dns/promises";
import { AppDataSource } from "../config/data-source.js";
import { Website } from "../models/Website.js";
import { Studio } from "../models/Studio.js";
import { Package } from "../models/Package.js";
import { Gallery } from "../models/Gallery.js";
import { Client } from "../models/Client.js";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";
import { ContactSubmission } from "../models/ContactSubmission.js";
import { generateWebsiteCopy } from "./local-ai.util.js";
import { getTheme } from "../config/themes.js";
import { sendWebsiteInquiryEmail } from "./email.service.js";
import { findConflicts, findAvailableSlots } from "./booking-ai.service.js";

const websiteRepo = () => AppDataSource.getRepository(Website);
const studioRepo = () => AppDataSource.getRepository(Studio);
const packageRepo = () => AppDataSource.getRepository(Package);
const galleryRepo = () => AppDataSource.getRepository(Gallery);
const clientRepo = () => AppDataSource.getRepository(Client);
const userRepo = () => AppDataSource.getRepository(User);
const bookingRepo = () => AppDataSource.getRepository(Booking);
const contactRepo = () => AppDataSource.getRepository(ContactSubmission);

const slugify = (s) =>
    (s || "studio")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

const uniqueSlug = async (base, excludeId) => {
    let slug = slugify(base);
    let n = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const existing = await websiteRepo().findOne({ where: { slug } });
        if (!existing || existing.id === excludeId) return slug;
        n += 1;
        slug = `${slugify(base)}-${n}`;
    }
};

const ensureWebsite = async (studioId) => {
    const repo = websiteRepo();
    let site = await repo.findOne({ where: { studioId } });
    if (!site) {
        const studio = await studioRepo().findOne({ where: { id: studioId } });
        const slug = await uniqueSlug(studio?.studioName || `studio-${studioId}`);
        site = repo.create({
            studioId,
            slug,
            theme: "amber-noir",
            isPublished: false,
            domainStatus: "none",
        });
        site = await repo.save(site);
    }
    return site;
};

// ── GET (studio's own website config, creates a draft row if none exists) ────
export const getMyWebsite = async (studioId) => ensureWebsite(studioId);

// ── UPDATE (manual edits from the builder UI) ─────────────────────────────────
export const updateMyWebsite = async (studioId, data) => {
    const repo = websiteRepo();
    const site = await ensureWebsite(studioId);

    const allowed = [
        "theme", "heroTitle", "heroSubtitle", "aboutText", "servicesIntro",
        "contactMessage", "seoDescription", "isPublished",
        "heroImageUrl", "logoUrl", "bookingEnabled",
    ];
    for (const key of allowed) {
        if (data[key] !== undefined) site[key] = data[key];
    }

    if (data.slug && data.slug !== site.slug) {
        site.slug = await uniqueSlug(data.slug, site.id);
    }
    if (data.socialLinks !== undefined) {
        site.socialLinks = JSON.stringify(data.socialLinks || {});
    }

    return repo.save(site);
};

// ── AI GENERATE ────────────────────────────────────────────────────────────────
export const generateWebsiteContent = async (studioId, { extraContext } = {}) => {
    const studio = await studioRepo().findOne({ where: { id: studioId } });
    if (!studio) throw Object.assign(new Error("Studio not found."), { status: 404 });

    const packages = await packageRepo().find({ where: { studioId, isActive: true } });

    const result = generateWebsiteCopy({
        studioName: studio.studioName,
        category: studio.category,
        address: studio.address,
        description: studio.description,
        packages,
        extraContext,
    });
    const theme = getTheme(result.themeId);

    const site = await ensureWebsite(studioId);
    const repo = websiteRepo();
    site.theme = theme.id;
    site.heroTitle = result.heroTitle;
    site.heroSubtitle = result.heroSubtitle;
    site.aboutText = result.aboutText;
    site.servicesIntro = result.servicesIntro;
    site.contactMessage = result.contactMessage;
    site.seoDescription = result.seoDescription;

    return repo.save(site);
};

// ── PAGE BUILDER (blocks) — WordPress-style drag & drop ────────────────────────
// blocks shape: [{ id, type, data }], type one of:
// hero | about | services | gallery | testimonials | cta | contact | booking | text-image | custom-text
export const getBlocks = async (studioId) => {
    const site = await ensureWebsite(studioId);
    return site.blocks ? JSON.parse(site.blocks) : [];
};

export const saveBlocks = async (studioId, blocks) => {
    if (!Array.isArray(blocks)) throw Object.assign(new Error("blocks must be an array."), { status: 400 });
    const repo = websiteRepo();
    const site = await ensureWebsite(studioId);
    // basic shape validation, assign stable ids if missing
    const cleaned = blocks.map((b, i) => ({
        id: b.id || `${Date.now()}-${i}-${crypto.randomBytes(3).toString("hex")}`,
        type: b.type,
        data: b.data || {},
    }));
    site.blocks = JSON.stringify(cleaned);
    await repo.save(site);
    return cleaned;
};

// ── CUSTOM DOMAIN ────────────────────────────────────────────────────────────
// Real-world flow: studio adds a domain -> we generate a verification token ->
// they add a TXT record (_studioverify.<domain>) -> we check it via DNS ->
// once verified, the domain is added to `verifiedDomains` and a reverse proxy
// (e.g. Caddy with `on_demand_tls` pointed at /api/v1/public/website/domain-check)
// automatically requests + renews a Let's Encrypt certificate for it. We can't
// issue certificates from inside this app — that step lives in the edge proxy —
// but the DNS verification and the "ask" endpoint it depends on are both real.
export const setCustomDomain = async (studioId, domain) => {
    const clean = (domain || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!clean || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(clean)) {
        throw Object.assign(new Error("Enter a valid domain, e.g. mystudio.com"), { status: 400 });
    }
    const existing = await websiteRepo().findOne({ where: { customDomain: clean } });
    const site = await ensureWebsite(studioId);
    if (existing && existing.id !== site.id) {
        throw Object.assign(new Error("This domain is already connected to another site."), { status: 409 });
    }

    site.customDomain = clean;
    site.domainStatus = "pending";
    site.domainVerificationToken = crypto.randomBytes(16).toString("hex");
    site.domainVerifiedAt = null;
    return websiteRepo().save(site);
};

export const removeCustomDomain = async (studioId) => {
    const site = await ensureWebsite(studioId);
    site.customDomain = null;
    site.domainStatus = "none";
    site.domainVerificationToken = null;
    site.domainVerifiedAt = null;
    return websiteRepo().save(site);
};

export const verifyCustomDomain = async (studioId) => {
    const site = await ensureWebsite(studioId);
    if (!site.customDomain) throw Object.assign(new Error("No domain configured yet."), { status: 400 });
    if (site.domainStatus === "verified") return site;

    const recordName = `_studioverify.${site.customDomain}`;
    let found = false;
    try {
        const records = await dns.resolveTxt(recordName);
        found = records.some((chunks) => chunks.join("").trim() === site.domainVerificationToken);
    } catch {
        found = false;
    }

    if (!found) {
        throw Object.assign(new Error(
            `TXT record not found yet. Add a TXT record for "${recordName}" with value "${site.domainVerificationToken}", then try again — DNS changes can take a few minutes to propagate.`
        ), { status: 422 });
    }

    site.domainStatus = "verified";
    site.domainVerifiedAt = new Date();
    return websiteRepo().save(site);
};

// Used by an edge proxy's on-demand TLS "ask" check — return 200 only for
// domains we've actually verified + published, else the proxy must refuse
// to request a certificate for it.
export const isDomainReadyForTLS = async (domain) => {
    const site = await websiteRepo().findOne({ where: { customDomain: (domain || "").toLowerCase() } });
    return !!(site && site.domainStatus === "verified" && site.isPublished);
};

// ── shared shaping for public output ──────────────────────────────────────────
const shapeSite = async (site) => {
    const studio = await studioRepo().findOne({ where: { id: site.studioId } });
    const packages = await packageRepo().find({ where: { studioId: site.studioId, isActive: true } });
    const galleries = await galleryRepo().find({ where: { studioId: site.studioId, isPublic: true }, take: 24 });
    const theme = getTheme(site.theme);

    return {
        slug: site.slug,
        theme,
        heroTitle: site.heroTitle,
        heroSubtitle: site.heroSubtitle,
        heroImageUrl: site.heroImageUrl,
        logoUrl: site.logoUrl,
        aboutText: site.aboutText,
        servicesIntro: site.servicesIntro,
        contactMessage: site.contactMessage,
        seoDescription: site.seoDescription,
        socialLinks: site.socialLinks ? JSON.parse(site.socialLinks) : {},
        blocks: site.blocks ? JSON.parse(site.blocks) : [],
        bookingEnabled: !!site.bookingEnabled,
        customDomain: site.domainStatus === "verified" ? site.customDomain : null,
        studio: {
            name: studio?.studioName,
            email: studio?.email,
            phone: studio?.phone,
            address: studio?.address,
            category: studio?.category,
        },
        packages: packages.map((p) => ({ id: p.id, name: p.name, description: p.description, price: p.price, duration: p.duration })),
        gallery: galleries.map((g) => ({
            id: g.id, title: g.title,
            coverPhoto: g.coverPhoto,
            photos: g.photos ? JSON.parse(g.photos) : [],
        })),
    };
};

// ── PUBLIC (unauthenticated) ──────────────────────────────────────────────────
export const getPublicWebsite = async (slug) => {
    const site = await websiteRepo().findOne({ where: { slug, isPublished: true } });
    if (!site) throw Object.assign(new Error("This studio website is not available."), { status: 404 });
    return shapeSite(site);
};

export const getPublicWebsiteByDomain = async (domain) => {
    const clean = (domain || "").toLowerCase().replace(/^www\./, "");
    const site = await websiteRepo().findOne({ where: { customDomain: clean, isPublished: true, domainStatus: "verified" } });
    if (!site) throw Object.assign(new Error("This studio website is not available."), { status: 404 });
    return shapeSite(site);
};

// ── PUBLIC contact form submission → dedicated ContactSubmission table ────────
export const submitInquiry = async (slug, { name, email, phone, message }, source = "website") => {
    if (!name || !email || !message) {
        throw Object.assign(new Error("Name, email and message are required."), { status: 400 });
    }

    const site = await websiteRepo().findOne({ where: { slug, isPublished: true } });
    if (!site) throw Object.assign(new Error("This studio website is not available."), { status: 404 });

    const studio = await studioRepo().findOne({ where: { id: site.studioId } });

    // Upsert a lightweight client record so the inquiry also shows up in the CRM
    let client = await clientRepo().findOne({ where: { studioId: site.studioId, email } });
    if (!client) {
        const [firstName, ...rest] = name.trim().split(" ");
        client = await clientRepo().save(clientRepo().create({
            studioId: site.studioId,
            firstName: firstName || name,
            lastName: rest.join(" ") || "",
            email, phone: phone || null,
            notes: `Website inquiry: ${message}`,
        }));
    }

    // Always keep the raw inquiry in its own table for analysis, regardless of CRM state
    const submission = await contactRepo().save(contactRepo().create({
        studioId: site.studioId,
        name, email, phone: phone || null, message,
        source,
        status: "new",
        clientId: client.id,
    }));

    const admin = await userRepo().findOne({ where: { studioId: site.studioId, role: "studio_admin" } });
    if (admin) {
        await sendWebsiteInquiryEmail(admin.email, studio?.studioName || "your studio", { name, email, phone, message });
    }

    return { message: "Thanks! Your message has been sent.", id: submission.id };
};

// ── PUBLIC booking widget → linked to the real booking system ─────────────────
// Never auto-confirms: creates a Booking with status "requested" so studio
// staff review + confirm it from the normal Bookings dashboard, plus logs a
// ContactSubmission (source: booking_widget) so it also feeds analytics.
export const getPublicAvailability = async (slug, { date, packageId, durationMinutes }) => {
    const site = await websiteRepo().findOne({ where: { slug, isPublished: true } });
    if (!site) throw Object.assign(new Error("This studio website is not available."), { status: 404 });

    let duration = parseInt(durationMinutes) || 60;
    if (packageId) {
        const pkg = await packageRepo().findOne({ where: { id: parseInt(packageId), studioId: site.studioId } });
        if (pkg?.duration) duration = pkg.duration;
    }

    const from = date ? new Date(date) : new Date();
    const slots = await findAvailableSlots(site.studioId, from, duration, null, 7, 12);
    return { durationMinutes: duration, slots };
};

export const createPublicBookingRequest = async (slug, payload) => {
    const { name, email, phone, packageId, startTime, durationMinutes, notes } = payload;
    if (!name || !email || !startTime) {
        throw Object.assign(new Error("Name, email and a requested time are required."), { status: 400 });
    }

    const site = await websiteRepo().findOne({ where: { slug, isPublished: true } });
    if (!site || !site.bookingEnabled) {
        throw Object.assign(new Error("Online booking isn't available for this studio right now."), { status: 404 });
    }

    const studio = await studioRepo().findOne({ where: { id: site.studioId } });

    let pkg = null;
    if (packageId) {
        pkg = await packageRepo().findOne({ where: { id: parseInt(packageId), studioId: site.studioId } });
    }
    const duration = parseInt(durationMinutes) || pkg?.duration || 60;
    const start = new Date(startTime);
    if (Number.isNaN(start.getTime()) || start < new Date()) {
        throw Object.assign(new Error("Please choose a valid, future date/time."), { status: 400 });
    }
    const end = new Date(start.getTime() + duration * 60000);

    // Studio-wide conflict check — never double-book a slot from the public widget
    const { studioConflicts } = await findConflicts(site.studioId, start, end, null, null);
    if (studioConflicts.length > 0) {
        throw Object.assign(new Error("That time slot was just taken. Please pick another."), { status: 409 });
    }

    // Match or create the client
    let client = await clientRepo().findOne({ where: { studioId: site.studioId, email } });
    if (!client) {
        const [firstName, ...rest] = name.trim().split(" ");
        client = await clientRepo().save(clientRepo().create({
            studioId: site.studioId,
            firstName: firstName || name,
            lastName: rest.join(" ") || "",
            email, phone: phone || null,
        }));
    }

    const booking = await bookingRepo().save(bookingRepo().create({
        studioId: site.studioId,
        clientId: client.id,
        packageId: pkg?.id || null,
        title: pkg ? `${pkg.name} — Website Booking Request` : "Website Booking Request",
        description: notes || null,
        startTime: start,
        endTime: end,
        status: "pending", // studio staff must confirm from the dashboard
        totalAmount: pkg?.price || null,
    }));

    await contactRepo().save(contactRepo().create({
        studioId: site.studioId,
        name, email, phone: phone || null,
        message: notes || `Requested booking: ${pkg ? pkg.name : "General session"} on ${start.toLocaleString()}`,
        source: "booking_widget",
        status: "new",
        clientId: client.id,
        bookingId: booking.id,
    }));

    const admin = await userRepo().findOne({ where: { studioId: site.studioId, role: "studio_admin" } });
    if (admin) {
        await sendWebsiteInquiryEmail(admin.email, studio?.studioName || "your studio", {
            name, email, phone,
            message: `New booking request via website: ${pkg ? pkg.name : "General session"} — ${start.toLocaleString()}. Please confirm from the Bookings dashboard.`,
        }).catch(() => {});
    }

    return { message: "Your booking request has been sent — the studio will confirm shortly.", bookingId: booking.id };
};
