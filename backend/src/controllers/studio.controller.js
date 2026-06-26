import {
    registerStudioWithAdmin,
    getAllStudios,
    getStudioById,
    updateStudio,
    deleteStudio,
} from "../services/studio.service.js";

// ── POST /api/v1/studios/register ─────────────────────────────────────────────
// Accepts BOTH formats:
//   1. Flat (from frontend):  { studioName, email, phone, address, adminFirstName, adminLastName, adminEmail, adminPassword }
//   2. Nested (from API):     { studio: {...}, adminUser: {...} }
export const registerStudioController = async (req, res) => {
    try {
        let studioData, userData;

        if (req.body.studio && req.body.adminUser) {
            // ── Nested format ──────────────────────────────────────────────────
            studioData = req.body.studio;
            userData   = req.body.adminUser;
        } else {
            // ── Flat format (sent by frontend RegisterPage) ────────────────────
            const {
                studioName, email, phone, address,
                adminFirstName, adminLastName, adminEmail, adminPassword,
            } = req.body;

            studioData = { studioName, email, phone, address };
            userData   = {
                firstName : adminFirstName,
                lastName  : adminLastName,
                email     : adminEmail,
                password  : adminPassword,
            };
        }

        // Validate studio fields
        const { studioName, email: studioEmail, phone, address } = studioData;
        if (!studioName || !studioEmail || !phone || !address) {
            return res.status(400).json({
                message: "Studio requires: studioName, email, phone, address.",
            });
        }

        // Validate admin user fields
        const { firstName, lastName, email: userEmail, password } = userData;
        if (!firstName || !lastName || !userEmail || !password) {
            return res.status(400).json({
                message: "Admin user requires: firstName, lastName, email, password.",
            });
        }

        const result = await registerStudioWithAdmin(studioData, userData);
        return res.status(201).json(result);
    } catch (error) {
        if (
            error.message?.includes("Violation of UNIQUE KEY constraint") ||
            error.message?.includes("unique") ||
            error.message?.includes("duplicate")
        ) {
            return res.status(409).json({ message: "Email or phone already in use." });
        }
        return res.status(500).json({ message: error.message });
    }
};

// ── GET /api/v1/studios ────────────────────────────────────────────────────────
export const getAllStudiosController = async (_req, res) => {
    try {
        const studios = await getAllStudios();
        return res.status(200).json(studios);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ── GET /api/v1/studios/:id ────────────────────────────────────────────────────
export const getStudioByIdController = async (req, res) => {
    try {
        const studio = await getStudioById(req.params.id);
        return res.status(200).json(studio);
    } catch (error) {
        const status = error.message.includes("not found") ? 404 : 500;
        return res.status(status).json({ message: error.message });
    }
};

// ── PUT /api/v1/studios/:id ────────────────────────────────────────────────────
export const updateStudioController = async (req, res) => {
    try {
        const studio = await updateStudio(req.params.id, req.body);
        return res.status(200).json(studio);
    } catch (error) {
        const status = error.message.includes("not found") ? 404 : 500;
        return res.status(status).json({ message: error.message });
    }
};

// ── DELETE /api/v1/studios/:id ─────────────────────────────────────────────────
export const deleteStudioController = async (req, res) => {
    try {
        const result = await deleteStudio(req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        const status = error.message.includes("not found") ? 404 : 500;
        return res.status(status).json({ message: error.message });
    }
};
