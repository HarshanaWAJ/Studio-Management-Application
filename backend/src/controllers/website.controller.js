import {
    getMyWebsite,
    updateMyWebsite,
    generateWebsiteContent,
    getPublicWebsite,
    getPublicWebsiteByDomain,
    submitInquiry,
    getBlocks,
    saveBlocks,
    setCustomDomain,
    removeCustomDomain,
    verifyCustomDomain,
    isDomainReadyForTLS,
    getPublicAvailability,
    createPublicBookingRequest,
} from "../services/website.service.js";
import { THEME_PRESETS } from "../config/themes.js";

const handle = (fn) => async (req, res) => {
    try {
        await fn(req, res);
    } catch (error) {
        console.error("[Website]", error);
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── Authenticated (studio dashboard) ──────────────────────────────────────────
export const getMyWebsiteController = handle(async (req, res) => {
    const site = await getMyWebsite(req.user.studioId);
    res.json(site);
});

export const updateMyWebsiteController = handle(async (req, res) => {
    const site = await updateMyWebsite(req.user.studioId, req.body);
    res.json(site);
});

export const generateController = handle(async (req, res) => {
    const site = await generateWebsiteContent(req.user.studioId, req.body || {});
    res.json(site);
});

export const themesController = handle(async (_req, res) => {
    res.json(THEME_PRESETS);
});

export const getBlocksController = handle(async (req, res) => {
    res.json(await getBlocks(req.user.studioId));
});

export const saveBlocksController = handle(async (req, res) => {
    res.json(await saveBlocks(req.user.studioId, req.body.blocks));
});

export const setDomainController = handle(async (req, res) => {
    res.json(await setCustomDomain(req.user.studioId, req.body.domain));
});

export const removeDomainController = handle(async (req, res) => {
    res.json(await removeCustomDomain(req.user.studioId));
});

export const verifyDomainController = handle(async (req, res) => {
    res.json(await verifyCustomDomain(req.user.studioId));
});

// ── Public (no auth) ──────────────────────────────────────────────────────────
export const publicWebsiteController = handle(async (req, res) => {
    const site = await getPublicWebsite(req.params.slug);
    res.json(site);
});

export const publicWebsiteByDomainController = handle(async (req, res) => {
    const site = await getPublicWebsiteByDomain(req.params.domain);
    res.json(site);
});

export const publicInquiryController = handle(async (req, res) => {
    const result = await submitInquiry(req.params.slug, req.body);
    res.json(result);
});

export const publicAvailabilityController = handle(async (req, res) => {
    res.json(await getPublicAvailability(req.params.slug, req.query));
});

export const publicBookController = handle(async (req, res) => {
    res.json(await createPublicBookingRequest(req.params.slug, req.body));
});

// Used by an edge proxy (e.g. Caddy `on_demand_tls.ask`) to decide whether it's
// allowed to request a TLS certificate for an arbitrary incoming domain.
export const domainCheckController = async (req, res) => {
    const domain = (req.query.domain || "").toLowerCase();
    const ok = await isDomainReadyForTLS(domain);
    if (ok) return res.status(200).send("ok");
    return res.status(404).send("not found");
};
