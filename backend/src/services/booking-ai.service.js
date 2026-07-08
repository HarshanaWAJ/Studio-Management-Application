import { AppDataSource } from "../config/data-source.js";
import { Booking } from "../models/Booking.js";
import { Client } from "../models/Client.js";
import { Package } from "../models/Package.js";
import { User } from "../models/User.js";
import { parseBookingText, pickRecommendedPackage } from "./local-ai.util.js";
import { LessThan, MoreThan, Not } from "typeorm";

const bookingRepo = () => AppDataSource.getRepository(Booking);
const clientRepo = () => AppDataSource.getRepository(Client);
const packageRepo = () => AppDataSource.getRepository(Package);
const userRepo = () => AppDataSource.getRepository(User);

// ── Business hours used for slot suggestion (24h clock, studio-local time) ───
const DAY_START_HOUR = 9;
const DAY_END_HOUR = 19;
const SLOT_STEP_MINUTES = 30;

// ── Conflict detection ────────────────────────────────────────────────────────
// Two ranges overlap if start < otherEnd AND end > otherStart.
export const findConflicts = async (studioId, startTime, endTime, assignedStaffId, excludeBookingId) => {
    const repo = bookingRepo();
    const where = {
        studioId,
        status: Not("cancelled"),
        startTime: LessThan(endTime),
        endTime: MoreThan(startTime),
    };
    if (excludeBookingId) where.id = Not(excludeBookingId);

    const overlapping = await repo.find({ where, relations: { client: true } });

    // Studio-wide conflicts (any overlapping booking at all) vs staff-specific
    const staffConflicts = assignedStaffId
        ? overlapping.filter((b) => b.assignedStaffId === assignedStaffId)
        : [];

    return { studioConflicts: overlapping, staffConflicts };
};

// ── Deterministic slot finder ─────────────────────────────────────────────────
// Scans forward from `fromDate` for `daysToScan` days, business hours only,
// returning the nearest N free slots of the requested duration.
export const findAvailableSlots = async (studioId, fromDate, durationMinutes, assignedStaffId, daysToScan = 7, limit = 5) => {
    const repo = bookingRepo();

    const scanStart = new Date(fromDate);
    scanStart.setHours(0, 0, 0, 0);
    const scanEnd = new Date(scanStart);
    scanEnd.setDate(scanEnd.getDate() + daysToScan);

    const where = {
        studioId,
        status: Not("cancelled"),
        startTime: LessThan(scanEnd),
        endTime: MoreThan(scanStart),
    };
    const existing = await repo.find({ where });
    const relevant = assignedStaffId
        ? existing.filter((b) => b.assignedStaffId === assignedStaffId || b.assignedStaffId == null)
        : existing;

    const slots = [];
    for (let d = 0; d < daysToScan && slots.length < limit; d++) {
        const day = new Date(scanStart);
        day.setDate(day.getDate() + d);
        // skip past days
        if (day < new Date(new Date().setHours(0, 0, 0, 0))) continue;

        for (let hour = DAY_START_HOUR; hour < DAY_END_HOUR && slots.length < limit; ) {
            const slotStart = new Date(day);
            slotStart.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
            const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

            const dayEndBoundary = new Date(day);
            dayEndBoundary.setHours(DAY_END_HOUR, 0, 0, 0);
            if (slotEnd > dayEndBoundary) break;

            // must be in the future
            if (slotStart > new Date()) {
                const clashes = relevant.some(
                    (b) => slotStart < new Date(b.endTime) && slotEnd > new Date(b.startTime)
                );
                if (!clashes) {
                    slots.push({ startTime: slotStart.toISOString(), endTime: slotEnd.toISOString() });
                }
            }
            hour += SLOT_STEP_MINUTES / 60;
        }
    }

    return slots.slice(0, limit);
};

// ── Fuzzy match helpers ───────────────────────────────────────────────────────
const normalize = (s) => (s || "").toLowerCase().trim();

const matchClient = (clients, hint) => {
    if (!hint) return null;
    const h = normalize(hint);
    return (
        clients.find((c) => normalize(`${c.firstName} ${c.lastName}`) === h) ||
        clients.find((c) => normalize(c.email) === h) ||
        clients.find((c) => normalize(`${c.firstName} ${c.lastName}`).includes(h) || h.includes(normalize(c.firstName))) ||
        null
    );
};

const matchPackage = (packages, hint) => {
    if (!hint) return null;
    const h = normalize(hint);
    return (
        packages.find((p) => normalize(p.name) === h) ||
        packages.find((p) => normalize(p.name).includes(h) || h.includes(normalize(p.name))) ||
        null
    );
};

// ── Main entrypoint: parse free text → structured draft + conflicts ─────────
// Uses the fully local/inbuilt AI engine (see local-ai.util.js) — no external
// API call is made.
export const parseBookingRequest = async (text, studioId) => {
    const [clients, packages, staff] = await Promise.all([
        clientRepo().find({ where: { studioId } }),
        packageRepo().find({ where: { studioId, isActive: true } }),
        userRepo().find({ where: { studioId } }),
    ]);

    const now = new Date();
    const draft = parseBookingText(text, { clients, packages, staff, now });

    // Resolve client/package/staff against real DB rows (the local parser
    // already does its own best-effort matching, but we re-resolve here via
    // the shared fuzzy matchers to stay consistent with the rest of the API).
    const matchedClient = draft._matchedClient || matchClient(clients, draft.clientHint);
    const matchedPackage = draft._matchedPackage || matchPackage(packages, draft.packageHint);
    const matchedStaff = draft._matchedStaff || (draft.staffHint
        ? staff.find((s) => normalize(`${s.firstName} ${s.lastName}`).includes(normalize(draft.staffHint)))
        : null);
    delete draft._matchedClient;
    delete draft._matchedPackage;
    delete draft._matchedStaff;

    let startTime = null;
    let endTime = null;
    let conflicts = null;
    let suggestedSlots = [];

    if (draft.date && draft.startTime) {
        startTime = new Date(`${draft.date}T${draft.startTime}:00`);
        const duration = draft.durationMinutes || matchedPackage?.duration || 120;
        endTime = new Date(startTime.getTime() + duration * 60000);

        if (!isNaN(startTime.getTime())) {
            const { studioConflicts, staffConflicts } = await findConflicts(
                studioId, startTime, endTime, matchedStaff?.id
            );
            if (studioConflicts.length > 0 || staffConflicts.length > 0) {
                conflicts = {
                    studioConflicts: studioConflicts.map((b) => ({ id: b.id, title: b.title, startTime: b.startTime, endTime: b.endTime })),
                    staffConflicts: staffConflicts.map((b) => ({ id: b.id, title: b.title, startTime: b.startTime, endTime: b.endTime })),
                };
                suggestedSlots = await findAvailableSlots(studioId, startTime, duration, matchedStaff?.id);
            }
        } else {
            startTime = null; endTime = null;
        }
    }

    return {
        draft,
        resolved: {
            client: matchedClient ? { id: matchedClient.id, name: `${matchedClient.firstName} ${matchedClient.lastName}` } : null,
            newClientName: draft.newClientName || null,
            package: matchedPackage ? { id: matchedPackage.id, name: matchedPackage.name, price: matchedPackage.price, duration: matchedPackage.duration } : null,
            staff: matchedStaff ? { id: matchedStaff.id, name: `${matchedStaff.firstName} ${matchedStaff.lastName}` } : null,
            startTime: startTime ? startTime.toISOString() : null,
            endTime: endTime ? endTime.toISOString() : null,
        },
        conflicts,
        suggestedSlots,
    };
};

// ── Standalone slot suggestion (no free text) ─────────────────────────────────
export const suggestSlots = async (studioId, { date, durationMinutes = 120, assignedStaffId }) => {
    const from = date ? new Date(date) : new Date();
    return findAvailableSlots(studioId, from, durationMinutes, assignedStaffId);
};

// ── Package recommendation ────────────────────────────────────────────────────
// Uses the local/inbuilt heuristic engine — no external API call is made.
export const recommendPackage = async (studioId, { clientId, text }) => {
    const packages = await packageRepo().find({ where: { studioId, isActive: true } });
    if (packages.length === 0) {
        return { recommendation: null, reasoning: "This studio has no active packages configured yet." };
    }

    let history = [];
    if (clientId) {
        history = await bookingRepo().find({ where: { studioId, clientId }, relations: { package: true } });
    }

    return pickRecommendedPackage({ packages, text: text || "", history });
};
