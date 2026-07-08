import {
    login,
    refreshAccessToken,
    getMe,
    verifyEmailToken,
    resendVerificationEmail,
    requestPasswordReset,
    resetPasswordWithToken,
    resendOtp,
    verifyEmailOtp,
    requestPasswordResetOtp,
    resetPasswordWithOtpProof,
} from "../services/auth.service.js";

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

// ── GET /api/v1/auth/verify-email?token=... ───────────────────────────────────
export const verifyEmailController = async (req, res) => {
    try {
        const { token } = req.query.token ? req.query : req.body;
        if (!token) return res.status(400).json({ message: "Token is required." });
        const result = await verifyEmailToken(token);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
};

// ── POST /api/v1/auth/resend-verification ──────────────────────────────────────
export const resendVerificationController = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required." });
        const result = await resendVerificationEmail(email);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
};

// ── POST /api/v1/auth/forgot-password ──────────────────────────────────────────
export const forgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required." });
        const result = await requestPasswordReset(email);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
};

// ── POST /api/v1/auth/reset-password ────────────────────────────────────────────
export const resetPasswordController = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: "Token and new password are required." });
        }
        const result = await resetPasswordWithToken(token, password);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
};

// ── OTP-based email verification & password reset ────────────────────────────

// POST /api/v1/auth/send-otp { email, purpose }
// purpose: "email_verification" | "password_reset"
export const sendOtpController = async (req, res) => {
    try {
        const { email, purpose } = req.body;
        if (!email || !purpose) {
            return res.status(400).json({ message: "email and purpose are required." });
        }
        if (!["email_verification", "password_reset"].includes(purpose)) {
            return res.status(400).json({ message: "Invalid purpose." });
        }
        const result = await resendOtp(email, purpose);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
};

// POST /api/v1/auth/verify-otp { email, otp, purpose }
export const verifyOtpController = async (req, res) => {
    try {
        const { email, otp, purpose } = req.body;
        if (!email || !otp || !purpose) {
            return res.status(400).json({ message: "email, otp and purpose are required." });
        }
        const result = await verifyEmailOtp(email, otp, purpose);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
};

// POST /api/v1/auth/forgot-password-otp { email }
export const forgotPasswordOtpController = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required." });
        const result = await requestPasswordResetOtp(email);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
};

// POST /api/v1/auth/reset-password-otp { resetToken, password }
export const resetPasswordOtpController = async (req, res) => {
    try {
        const { resetToken, password } = req.body;
        if (!resetToken || !password) {
            return res.status(400).json({ message: "resetToken and password are required." });
        }
        const result = await resetPasswordWithOtpProof(resetToken, password);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
};
