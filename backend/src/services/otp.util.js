import bcrypt from "bcryptjs";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Shared OTP helpers used by auth.service.js for both registration email
// verification and password reset. Codes are 6 digits, expire after a short
// window, and are rate-limited by attempt count so they can't be brute-forced.
// ─────────────────────────────────────────────────────────────────────────────

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export const generateOtpCode = () => {
    // Cryptographically-strong 6-digit numeric code, zero-padded.
    const n = crypto.randomInt(0, 10 ** OTP_LENGTH);
    return String(n).padStart(OTP_LENGTH, "0");
};

export const hashOtpCode = async (code) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(code, salt);
};

export const compareOtpCode = async (code, hash) => {
    if (!code || !hash) return false;
    return bcrypt.compare(code, hash);
};

export const generateProofToken = () => crypto.randomBytes(32).toString("hex");

export const otpExpiryDate = () => new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
