import {
    parseBookingRequest,
    suggestSlots,
    recommendPackage,
    findConflicts,
} from "../services/booking-ai.service.js";
import { isAiConfigured, AI_ENGINE_NAME } from "../services/local-ai.util.js";

const handle = (fn) => async (req, res) => {
    try {
        await fn(req, res);
    } catch (error) {
        console.error("[AI]", error);
        res.status(error.status || 500).json({ message: error.message });
    }
};

// GET /api/v1/ai/status
export const statusController = handle(async (_req, res) => {
    // AI Assist runs entirely in-process (no external API/key required).
    res.json({ configured: isAiConfigured(), engine: "local", engineName: AI_ENGINE_NAME });
});

// POST /api/v1/ai/parse-booking { text }
export const parseBookingController = handle(async (req, res) => {
    const { text } = req.body;
    if (!text || !text.trim()) {
        return res.status(400).json({ message: "Please describe the booking you'd like to create." });
    }
    const result = await parseBookingRequest(text, req.user.studioId);
    res.json(result);
});

// POST /api/v1/ai/suggest-slots { date, durationMinutes, assignedStaffId }
export const suggestSlotsController = handle(async (req, res) => {
    const slots = await suggestSlots(req.user.studioId, req.body);
    res.json({ slots });
});

// POST /api/v1/ai/recommend-package { clientId, text }
export const recommendPackageController = handle(async (req, res) => {
    const result = await recommendPackage(req.user.studioId, req.body);
    res.json(result);
});

// POST /api/v1/ai/check-conflicts { startTime, endTime, assignedStaffId, excludeBookingId }
export const checkConflictsController = handle(async (req, res) => {
    const { startTime, endTime, assignedStaffId, excludeBookingId } = req.body;
    if (!startTime || !endTime) {
        return res.status(400).json({ message: "startTime and endTime are required." });
    }
    const result = await findConflicts(
        req.user.studioId, new Date(startTime), new Date(endTime), assignedStaffId, excludeBookingId
    );
    res.json(result);
});
