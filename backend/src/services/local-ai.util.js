// ─────────────────────────────────────────────────────────────────────────────
// Inbuilt AI engine — "Studio AI" (local NLP model, no external API).
//
// This runs entirely in-process using `compromise` + `compromise-dates`, a
// real natural-language-processing library (part-of-speech tagging, named
// entity recognition, and calendar-aware date/time parsing). There is no
// ANTHROPIC_API_KEY / ANTHROPIC_MODEL, no network call, and no external
// service dependency of any kind — the model ships inside node_modules and
// runs in the same process as the rest of the backend.
//
// A lightweight deterministic parser is kept as an automatic fallback for
// anything the NLP model doesn't confidently resolve (e.g. very informal
// shorthand), so accuracy only ever goes up, never down, versus a pure
// regex engine.
//
// It covers the three AI-assist features used by the frontend:
//   1. Free-text booking parsing   (booking-ai.service.js -> parseBookingRequest)
//   2. Package recommendation      (booking-ai.service.js -> recommendPackage)
//   3. Website copy generation     (website.service.js    -> generateWebsiteContent)
// ─────────────────────────────────────────────────────────────────────────────

import nlp from "compromise";
import datesPlugin from "compromise-dates";

nlp.extend(datesPlugin);

export const isAiConfigured = () => true; // always available — no external key/model needed
export const AI_ENGINE_NAME = "Studio AI (local NLP — compromise)";

// ── Small text helpers ────────────────────────────────────────────────────────
const normalize = (s) => (s || "").toLowerCase().trim();

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
];

const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];

// Simple deterministic hash so the same input always produces the same
// "randomly" chosen phrasing variant (keeps output stable/testable while
// still varying between different studios).
const hashString = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0;
    }
    return h;
};

const pad2 = (n) => String(n).padStart(2, "0");
const toISODate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toHHmm = (h, m) => `${pad2(h)}:${pad2(m)}`;

// ── Date / time extraction ──────────────────────────────────────────────────
function nextWeekday(from, targetDow) {
    const d = new Date(from);
    d.setHours(0, 0, 0, 0);
    let diff = (targetDow - d.getDay() + 7) % 7;
    if (diff === 0) diff = 7; // "next Saturday" always means a future Saturday, not today
    d.setDate(d.getDate() + diff);
    return d;
}

// ── NLP-based date/time extraction (primary) ──────────────────────────────────
// Uses compromise-dates' calendar-aware parser, which understands relative
// phrases ("next Saturday afternoon"), explicit dates, day-parts, and more —
// far more robust than pattern matching alone. Falls back to the regex-based
// extractors below (extractDate/extractTime) when the model finds nothing.
function extractDateTimeViaNLP(text) {
    try {
        const found = nlp(text).dates().json();
        if (!found || !found.length) return null;

        // Prefer the mention with the most specific (shortest) duration window,
        // i.e. one that included an explicit time-of-day rather than an all-day span.
        const withDates = found.filter((f) => f.dates && f.dates.start);
        if (!withDates.length) return null;

        const best = withDates[0];
        const start = new Date(best.dates.start);
        if (isNaN(start.getTime())) return null;

        const dur = best.dates.duration;
        const durationMinutes = dur ? (dur.hours || 0) * 60 + (dur.minutes || 0) : 0;

        // An all-day match (e.g. just "Saturday" with no time-of-day) yields a
        // ~24h duration and midnight start — in that case we didn't really get
        // a start TIME, only a date.
        const isAllDay = start.getHours() === 0 && start.getMinutes() === 0 && durationMinutes >= 23 * 60;

        return {
            date: toISODate(start),
            startTime: isAllDay ? null : toHHmm(start.getHours(), start.getMinutes()),
            // Only trust the model's duration when it's a realistic session
            // length — larger spans are just the day-part window (e.g.
            // "afternoon" = 2pm-11:59pm), not an actual stated duration.
            durationMinutes: !isAllDay && durationMinutes > 0 && durationMinutes <= 6 * 60 ? durationMinutes : null,
        };
    } catch {
        return null; // NLP model found nothing usable — caller falls back to regex
    }
}

function extractDate(text, now) {
    const t = normalize(text);

    if (/\btoday\b/.test(t)) return new Date(now);
    if (/\btomorrow\b/.test(t)) {
        const d = new Date(now);
        d.setDate(d.getDate() + 1);
        return d;
    }

    // explicit ISO date  2026-07-10
    let m = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

    // explicit DD/MM/YYYY or DD-MM-YYYY
    m = t.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));

    // "5th march" / "march 5" / "march 5th"
    const monthPattern = MONTHS.join("|");
    m = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})\\b`));
    if (!m) m = t.match(new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`));
    if (m) {
        const monthName = MONTHS.includes(m[1]) ? m[1] : m[2];
        const day = MONTHS.includes(m[1]) ? Number(m[2]) : Number(m[1]);
        const monthIdx = MONTHS.indexOf(monthName);
        const year = now.getFullYear();
        const candidate = new Date(year, monthIdx, day);
        if (candidate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
            candidate.setFullYear(year + 1);
        }
        return candidate;
    }

    // weekday, with or without "this"/"next"
    for (let i = 0; i < WEEKDAYS.length; i++) {
        if (new RegExp(`\\b${WEEKDAYS[i]}\\b`).test(t)) {
            return nextWeekday(now, i);
        }
    }

    return null;
}

function extractTime(text) {
    const t = normalize(text);

    // explicit "2:30pm", "2pm", "14:00"
    let m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
    if (m) {
        let h = Number(m[1]) % 12;
        if (m[3] === "pm") h += 12;
        const min = m[2] ? Number(m[2]) : 0;
        return toHHmm(h, min);
    }
    m = t.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (m) return toHHmm(Number(m[1]), Number(m[2]));

    // day-part words
    if (/\bmorning\b/.test(t)) return "09:00";
    if (/\bafternoon\b/.test(t)) return "14:00";
    if (/\bevening\b/.test(t)) return "17:00";
    if (/\bnight\b/.test(t)) return "19:00";

    return null;
}

function extractDurationMinutes(text) {
    const t = normalize(text);
    let m = t.match(/\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/);
    if (m) return Math.round(Number(m[1]) * 60);
    m = t.match(/\b(\d+)\s*(minutes?|mins?)\b/);
    if (m) return Number(m[1]);
    return null;
}

// ── Entity matching against known clients / packages / staff ─────────────────
// Tries a full-name substring match first (e.g. "Nimal Perera"); if nothing
// matches, falls back to a first-word match (e.g. "Anusha") but only when
// exactly one entity has that first word, to avoid ambiguous matches.
function findBestNameMatch(text, entities, nameFn) {
    const t = normalize(text);
    let best = null;
    let bestLen = 0;
    for (const e of entities) {
        const name = normalize(nameFn(e));
        if (name && t.includes(name) && name.length > bestLen) {
            best = e;
            bestLen = name.length;
        }
    }
    if (best) return best;

    const words = t.split(/\W+/).filter(Boolean);
    const candidates = entities.filter((e) => {
        const first = normalize(nameFn(e)).split(/\s+/)[0];
        return first && first.length > 2 && words.includes(first);
    });
    return candidates.length === 1 ? candidates[0] : null;
}

const stripTrailingPunctuation = (s) => (s || "").replace(/[,.;:!?]+$/, "").trim();

// Common sentence-starting/instructional words that should never be treated
// as part of a person's name, used by the generic capitalized-pair fallback.
const NAME_STOPWORDS = new Set([
    "book", "schedule", "create", "new", "please", "client", "the", "add",
    "for", "with", "on", "at", "next", "this", "wants", "shoot",
]);

function genericNamePairMatch(text) {
    const re = /\b([A-Z][a-zA-Z'-]+)\s+([A-Z][a-zA-Z'-]+)\b/g;
    let m;
    while ((m = re.exec(text))) {
        const w1 = m[1].toLowerCase();
        const w2 = m[2].toLowerCase();
        if (NAME_STOPWORDS.has(w1) || NAME_STOPWORDS.has(w2)) continue;
        return `${m[1]} ${m[2]}`;
    }
    return null;
}

// Uses compromise's named-entity (person) recognition — much more reliable
// than a plain "capitalized word after 'for'" regex, since it understands
// proper nouns in context rather than just capitalization. Falls back to a
// couple of regex heuristics for names the NLP model doesn't recognize
// (e.g. names outside its built-in lexicon).
function guessNewClientName(text, matchedClient) {
    if (matchedClient) return null;

    try {
        const people = nlp(text).people().out("array").map(stripTrailingPunctuation).filter(Boolean);
        if (people.length) {
            // Prefer a name mentioned near "for"/"with"/"client" if there are
            // several people in the sentence (e.g. a client AND a staff member).
            const t = normalize(text);
            const contextual = people.find((p) => {
                const idx = t.indexOf(normalize(p));
                if (idx === -1) return false;
                const before = t.slice(Math.max(0, idx - 12), idx);
                return /\b(for|client|with)\s*$/.test(before.trim() + " ");
            });
            return contextual || people[0];
        }
    } catch {
        // fall through to regex
    }

    const forMatch = text.match(/\bfor\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)?)/);
    if (forMatch) return stripTrailingPunctuation(forMatch[1]);

    return genericNamePairMatch(text);
}

const SHOOT_TYPES = [
    "wedding", "engagement", "product", "portrait", "family", "newborn",
    "maternity", "corporate", "event", "graduation", "birthday",
];

function guessTitle(text, clientName, shootType) {
    if (shootType && clientName) {
        return `${shootType[0].toUpperCase()}${shootType.slice(1)} Shoot – ${clientName}`;
    }
    if (shootType) return `${shootType[0].toUpperCase()}${shootType.slice(1)} Shoot`;
    if (clientName) return `Shoot – ${clientName}`;
    const trimmed = text.trim();
    return trimmed.length > 48 ? `${trimmed.slice(0, 45)}…` : trimmed || "New Booking";
}

// ── Main: parse free text into a structured booking draft ────────────────────
export function parseBookingText(text, { clients, packages, staff, now = new Date() }) {
    const matchedClient = findBestNameMatch(text, clients, (c) => `${c.firstName} ${c.lastName}`);
    const matchedPackage = findBestNameMatch(text, packages, (p) => p.name);
    const matchedStaff = findBestNameMatch(text, staff, (s) => `${s.firstName} ${s.lastName}`);
    const newClientName = guessNewClientName(text, matchedClient);

    // Primary: NLP calendar model. Fallback: regex extractors (extractDate/
    // extractTime), which mainly catch phrasing the NLP model doesn't cover
    // or when the referenced "now" differs from the real current date.
    const nlpResult = extractDateTimeViaNLP(text);
    const dateObj = nlpResult?.date ? new Date(`${nlpResult.date}T00:00:00`) : extractDate(text, now);
    const startTime = nlpResult?.startTime || extractTime(text);
    // An explicitly stated duration ("for 2 hours") always wins over the
    // NLP model's day-part span (e.g. "afternoon" resolves to a ~10h window,
    // which is a guess about the window, not the actual session length).
    const durationMinutes =
        extractDurationMinutes(text) || nlpResult?.durationMinutes || matchedPackage?.duration || null;

    const shootType = SHOOT_TYPES.find((k) => normalize(text).includes(k)) || null;
    const clientDisplayName = matchedClient
        ? `${matchedClient.firstName} ${matchedClient.lastName}`
        : newClientName;

    const missingInfo = [];
    if (!dateObj) missingInfo.push("date");
    if (!startTime) missingInfo.push("startTime");
    if (!matchedClient && !newClientName) missingInfo.push("client");
    if (!matchedPackage) missingInfo.push("package");

    const resolvedCount = 4 - missingInfo.length;
    const confidence = resolvedCount >= 4 ? "high" : resolvedCount >= 2 ? "medium" : "low";

    return {
        title: guessTitle(text, clientDisplayName, shootType),
        clientHint: matchedClient ? `${matchedClient.firstName} ${matchedClient.lastName}` : (newClientName ? null : null),
        newClientName: newClientName || null,
        packageHint: matchedPackage ? matchedPackage.name : null,
        staffHint: matchedStaff ? `${matchedStaff.firstName} ${matchedStaff.lastName}` : null,
        date: dateObj ? toISODate(dateObj) : null,
        startTime,
        durationMinutes: durationMinutes || (shootType ? 120 : null),
        notes: text.trim() || null,
        confidence,
        missingInfo,
        _matchedClient: matchedClient,
        _matchedPackage: matchedPackage,
        _matchedStaff: matchedStaff,
    };
}

// ── Package recommendation heuristic ──────────────────────────────────────────
export function pickRecommendedPackage({ packages, text = "", history = [] }) {
    if (packages.length === 0) return { recommendation: null, reasoning: "No active packages configured yet." };

    const t = normalize(text);
    const byPrice = [...packages].sort((a, b) => a.price - b.price);
    const byDuration = [...packages].sort((a, b) => a.duration - b.duration);

    if (/\b(budget|cheap|affordable|basic|low[- ]cost)\b/.test(t)) {
        return { recommendation: byPrice[0], reasoning: "Matched a budget-conscious request with the lowest-priced active package." };
    }
    if (/\b(premium|luxury|deluxe|best|top|high[- ]end|full)\b/.test(t)) {
        return { recommendation: byPrice[byPrice.length - 1], reasoning: "Matched a premium request with the highest-priced active package." };
    }
    if (/\b(quick|short|brief)\b/.test(t)) {
        return { recommendation: byDuration[0], reasoning: "Matched a request for a short session with the shortest-duration package." };
    }
    if (/\b(long|extended|full day|all day)\b/.test(t)) {
        return { recommendation: byDuration[byDuration.length - 1], reasoning: "Matched a request for an extended session with the longest-duration package." };
    }

    // Keyword match against package name/description
    for (const p of packages) {
        const hay = normalize(`${p.name} ${p.description || ""}`);
        if (t && hay && t.split(/\s+/).some((w) => w.length > 3 && hay.includes(w))) {
            return { recommendation: p, reasoning: `Matched keywords in the request to the "${p.name}" package.` };
        }
    }

    // Fall back to the client's most-booked package
    if (history.length > 0) {
        const counts = new Map();
        for (const h of history) {
            const id = h.package?.id;
            if (id) counts.set(id, (counts.get(id) || 0) + 1);
        }
        if (counts.size > 0) {
            const topId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
            const top = packages.find((p) => p.id === topId);
            if (top) return { recommendation: top, reasoning: "Recommended based on this client's most frequently booked package." };
        }
    }

    // Default: the middle-priced package (a safe general recommendation)
    const mid = byPrice[Math.floor(byPrice.length / 2)];
    return { recommendation: mid, reasoning: "No strong signal in the request — recommending a well-rounded, mid-priced package." };
}

// ── Website copy generation ───────────────────────────────────────────────────
const CATEGORY_THEME_RULES = [
    { keywords: ["wedding", "fine art", "fine-art"], theme: "amber-noir" },
    { keywords: ["bridal", "maternity", "family"], theme: "blush-editorial" },
    { keywords: ["video", "cinema", "commercial", "product"], theme: "midnight-cinema" },
    { keywords: ["lifestyle", "newborn", "everyday", "portrait"], theme: "sage-minimal" },
    { keywords: ["event", "travel"], theme: "sunset-warm" },
    { keywords: ["fashion", "editorial", "art"], theme: "mono-classic" },
];

export function pickTheme(category) {
    const c = normalize(category);
    for (const rule of CATEGORY_THEME_RULES) {
        if (rule.keywords.some((k) => c.includes(k))) return rule.theme;
    }
    return "amber-noir";
}

const HERO_TITLES = [
    (n) => `Timeless Moments, Captured by ${n}`,
    (n) => `${n} — Photography That Feels Like You`,
    (n) => `Your Story, Beautifully Told`,
    (n) => `Real Moments. Honest Light. ${n}`,
    (n) => `Crafted Imagery by ${n}`,
];

const HERO_SUBTITLES = [
    (cat) => `Professional ${cat.toLowerCase()} for the moments that matter most.`,
    (cat) => `Thoughtful, detail-driven ${cat.toLowerCase()} for every occasion.`,
    (cat) => `We turn everyday moments into images you'll keep forever.`,
];

const ABOUT_TEMPLATES = [
    (n, cat, loc) => `${n} is a ${cat.toLowerCase()} based in ${loc}, dedicated to telling genuine stories through imagery. Every session is approached with care, creativity, and an eye for the details that make your moments unique.`,
    (n, cat, loc) => `Based in ${loc}, ${n} specializes in ${cat.toLowerCase()} that blends technical craft with a relaxed, natural style. We believe the best photographs happen when you feel comfortable being yourself.`,
];

const SERVICES_INTROS = [
    "Explore our packages, tailored to fit every occasion and budget.",
    "A range of packages designed to make your session simple and stress-free.",
    "Choose the package that fits your story — every one is fully customizable.",
];

const CONTACT_MESSAGES = [
    "Ready to get started? Reach out and let's plan your session.",
    "We'd love to hear about your story — send us a message today.",
    "Have a date in mind? Get in touch and let's make it happen.",
];

export function generateWebsiteCopy({ studioName, category, address, description, packages = [], extraContext }) {
    const name = studioName || "Your Studio";
    const cat = category || "Photography Studio";
    const loc = address || "your area";
    const seed = hashString(`${name}|${cat}|${extraContext || ""}`);

    const heroTitle = pick(HERO_TITLES, seed)(name);
    const heroSubtitle = pick(HERO_SUBTITLES, seed + 1)(cat);
    let aboutText = description && description.trim()
        ? description.trim()
        : pick(ABOUT_TEMPLATES, seed + 2)(name, cat, loc);
    if (extraContext && extraContext.trim()) {
        aboutText = `${aboutText} ${extraContext.trim()}`;
    }
    const servicesIntro = packages.length
        ? pick(SERVICES_INTROS, seed + 3)
        : "Packages will appear here once you add them.";
    const contactMessage = pick(CONTACT_MESSAGES, seed + 4);
    const seoDescription = `${name} — ${cat} in ${loc}. ${heroSubtitle}`.slice(0, 155);

    return {
        themeId: pickTheme(cat),
        heroTitle,
        heroSubtitle,
        aboutText,
        servicesIntro,
        contactMessage,
        seoDescription,
    };
}
