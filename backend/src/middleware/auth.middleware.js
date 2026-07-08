import jwt from "jsonwebtoken";
import { hasPermission } from "../config/permissions.js";

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// ── Token generators ─────────────────────────────────────────────────────────

export const signAccessToken = (payload) =>
    jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });

export const signRefreshToken = (payload) =>
    jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });

// ── authenticate middleware ───────────────────────────────────────────────────
// Validates the Authorization: Bearer <token> header.
// On success → attaches req.user = { id, email, role, studioId }
export const authenticate = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res
                .status(401)
                .json({ message: "Token expired. Please refresh your token." });
        }
        return res.status(401).json({ message: "Invalid token." });
    }
};

// ── authorize middleware factory ──────────────────────────────────────────────
// Usage: authorize("studio_admin") or authorize("studio_admin", "super_admin")
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated." });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Forbidden. Required role(s): ${roles.join(", ")}`,
            });
        }
        next();
    };
};

// ── requirePermission middleware factory ──────────────────────────────────────
// Fine-grained RBAC check, layered on top of role. The JWT payload carries
// the user's fully-resolved `permissions` array (role defaults + overrides)
// computed at login/refresh time — see auth.service.js buildTokenPair().
// Usage: requirePermission("staff:invite")
export const requirePermission = (...required) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated." });
        }
        // super_admin / studio_admin bypass fine-grained checks — they hold
        // every permission by default anyway (see config/permissions.js).
        const permissions = req.user.permissions || [];
        const ok = required.every((p) => hasPermission(permissions, p));
        if (!ok) {
            return res.status(403).json({
                message: `Forbidden. Missing permission(s): ${required.join(", ")}`,
            });
        }
        next();
    };
};
