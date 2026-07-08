import express from "express";
import {
    loginController,
    refreshController,
    meController,
    verifyEmailController,
    resendVerificationController,
    forgotPasswordController,
    resetPasswordController,
    sendOtpController,
    verifyOtpController,
    forgotPasswordOtpController,
    resetPasswordOtpController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public
router.post("/login", loginController);       // POST /api/v1/auth/login
router.post("/refresh", refreshController);   // POST /api/v1/auth/refresh

// Email verification — legacy link-based (kept for backward compatibility)
router.get("/verify-email", verifyEmailController);       // GET  /api/v1/auth/verify-email?token=...
router.post("/verify-email", verifyEmailController);       // POST /api/v1/auth/verify-email { token }
router.post("/resend-verification", resendVerificationController);

// Password reset — legacy link-based (kept for backward compatibility)
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

// ── OTP-based email verification & password reset (used by the frontend) ────
router.post("/send-otp", sendOtpController);                     // { email, purpose }
router.post("/verify-otp", verifyOtpController);                 // { email, otp, purpose }
router.post("/forgot-password-otp", forgotPasswordOtpController); // { email }
router.post("/reset-password-otp", resetPasswordOtpController);   // { resetToken, password }

// Protected
router.get("/me", authenticate, meController); // GET  /api/v1/auth/me

export default router;
