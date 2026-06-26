import { login, refreshAccessToken, getMe } from "../services/auth.service.js";

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────
export const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email and password are required." });
        }

        const result = await login(email, password);
        return res.status(200).json(result);
    } catch (error) {
        return res
            .status(error.status || 500)
            .json({ message: error.message });
    }
};

// ── POST /api/v1/auth/refresh ─────────────────────────────────────────────────
export const refreshController = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res
                .status(400)
                .json({ message: "Refresh token is required." });
        }

        const tokens = await refreshAccessToken(refreshToken);
        return res.status(200).json(tokens);
    } catch (error) {
        return res
            .status(error.status || 500)
            .json({ message: error.message });
    }
};

// ── GET /api/v1/auth/me  (requires authenticate middleware) ───────────────────
export const meController = async (req, res) => {
    try {
        const user = await getMe(req.user.id);
        return res.status(200).json(user);
    } catch (error) {
        return res
            .status(error.status || 500)
            .json({ message: error.message });
    }
};
