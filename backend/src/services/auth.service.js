import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AppDataSource } from "../config/data-source.js";
import { User } from "../models/User.js";
import { resolvePermissions } from "../config/permissions.js";
import {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendOtpEmail,
} from "./email.service.js";
import {
    generateOtpCode,
    hashOtpCode,
    compareOtpCode,
    generateProofToken,
    otpExpiryDate,
    OTP_MAX_ATTEMPTS,
    OTP_RESEND_COOLDOWN_SECONDS,
} from "./otp.util.js";

const userRepo = () => AppDataSource.getRepository(User);

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// If "true", unverified users cannot log in. Defaults to false so demos /
// existing flows keep working unless explicitly opted-in.
const REQUIRE_EMAIL_VERIFICATION =
    (process.env.REQUIRE_EMAIL_VERIFICATION || "false").toLowerCase() === "true";

// ── Helpers ──────────────────────────────────────────────────────────────────

export const hashPassword = async (plainPassword) => {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(plainPassword, salt);
};

const generateToken = () => crypto.randomBytes(32).toString("hex");

const buildTokenPair = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        studioId: user.studioId,
        permissions: resolvePermissions(user.role, user.permissions),
    };
    const accessToken = jwt.sign(payload, ACCESS_SECRET, {
        expiresIn: ACCESS_EXPIRES,
    });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, {
        expiresIn: REFRESH_EXPIRES,
    });
    return { accessToken, refreshToken };
};

const sanitizeUser = (user) => {
    const {
        passwordHash, emailVerificationToken, passwordResetToken,
        otpCodeHash, otpResetProofToken,
        ...safe
    } = user;
    return safe;
};

// ── login ────────────────────────────────────────────────────────────────────
export const login = async (email, password) => {
    email = email.trim().toLowerCase();

    const user = await userRepo().findOne({
        where: { email },
        relations: { studio: true },
    });

    if (!user) {
        throw Object.assign(new Error("Invalid email or password."), {
            status: 401,
        });
    }

    if (!user.isActive || user.status === "suspended" || user.status === "inactive") {
        throw Object.assign(new Error("Account is deactivated. Contact your studio admin."), {
            status: 403,
        });
    }

    if (user.studio && user.studio.isActive === false) {
        throw Object.assign(new Error("This studio's account has been deactivated. Please contact support."), {
            status: 403,
        });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
        throw Object.assign(new Error("Invalid email or password."), {
            status: 401,
        });
    }

    if (REQUIRE_EMAIL_VERIFICATION && !user.isEmailVerified) {
        throw Object.assign(
            new Error("Please verify your email address before logging in."),
            { status: 403, code: "EMAIL_NOT_VERIFIED" }
        );
    }

    if (user.mustSetPassword) {
        throw Object.assign(
            new Error("Please set your password using the link sent to your email."),
            { status: 403, code: "MUST_SET_PASSWORD" }
        );
    }

    const { accessToken, refreshToken } = buildTokenPair(user);

    return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
    };
};

// ── refreshAccessToken ───────────────────────────────────────────────────────
export const refreshAccessToken = async (token) => {
    let decoded;
    try {
        decoded = jwt.verify(token, REFRESH_SECRET);
    } catch {
        throw Object.assign(new Error("Invalid or expired refresh token."), {
            status: 401,
        });
    }

    const user = await userRepo().findOne({ where: { id: decoded.id } });
    if (!user || !user.isActive) {
        throw Object.assign(new Error("User not found or deactivated."), {
            status: 401,
        });
    }

    const { accessToken, refreshToken } = buildTokenPair(user);
    return { accessToken, refreshToken };
};

// ── getMe ────────────────────────────────────────────────────────────────────
export const getMe = async (userId) => {
    const user = await userRepo().findOne({
        where: { id: userId },
        relations: { studio: true },
    });
    if (!user) {
        throw Object.assign(new Error("User not found."), { status: 404 });
    }
    return sanitizeUser(user);
};

// ── Email verification ────────────────────────────────────────────────────────

// Attaches a fresh verification token to a (just-created / not-yet-verified)
// user and emails it. Returns the raw token in case the caller needs it.
export const issueEmailVerification = async (user) => {
    const repo = userRepo();
    const token = generateToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await repo.update(user.id, {
        emailVerificationToken: token,
        emailVerificationExpires: expires,
    });

    await sendVerificationEmail(user, token);
    return token;
};

export const verifyEmailToken = async (token) => {
    const repo = userRepo();
    const user = await repo.findOne({ where: { emailVerificationToken: token } });

    if (!user) {
        throw Object.assign(new Error("Invalid or already-used verification link."), {
            status: 400,
        });
    }
    if (user.emailVerificationExpires && new Date(user.emailVerificationExpires) < new Date()) {
        throw Object.assign(new Error("Verification link has expired. Please request a new one."), {
            status: 400,
        });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await repo.save(user);

    return { message: "Email verified successfully." };
};

export const resendVerificationEmail = async (email) => {
    const repo = userRepo();
    const user = await repo.findOne({
        where: { email: email.trim().toLowerCase() },
        relations: { studio: true },
    });

    // Don't reveal whether the account exists
    if (!user || user.isEmailVerified) {
        return { message: "If that account exists and is unverified, a new email has been sent." };
    }

    await issueEmailVerification(user);
    return { message: "If that account exists and is unverified, a new email has been sent." };
};

// ── Password reset ────────────────────────────────────────────────────────────

export const requestPasswordReset = async (email) => {
    const repo = userRepo();
    const user = await repo.findOne({ where: { email: email.trim().toLowerCase() } });

    // Don't reveal whether the account exists
    if (!user) {
        return { message: "If that email is registered, a reset link has been sent." };
    }

    const token = generateToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await repo.update(user.id, {
        passwordResetToken: token,
        passwordResetExpires: expires,
    });

    await sendPasswordResetEmail(user, token);
    return { message: "If that email is registered, a reset link has been sent." };
};

export const resetPasswordWithToken = async (token, newPassword) => {
    if (!newPassword || newPassword.length < 6) {
        throw Object.assign(new Error("Password must be at least 6 characters."), {
            status: 400,
        });
    }

    const repo = userRepo();
    const user = await repo.findOne({ where: { passwordResetToken: token } });

    if (!user) {
        throw Object.assign(new Error("Invalid or already-used reset link."), {
            status: 400,
        });
    }
    if (user.passwordResetExpires && new Date(user.passwordResetExpires) < new Date()) {
        throw Object.assign(new Error("Reset link has expired. Please request a new one."), {
            status: 400,
        });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.mustSetPassword = false;
    // Setting a password via a verified email link is proof of ownership
    user.isEmailVerified = true;
    await repo.save(user);

    return { message: "Password updated successfully. You can now log in." };
};

// ── OTP: email verification & password reset ─────────────────────────────────
// Both flows share one OTP "slot" on the user record (otpCodeHash/otpPurpose/
// otpExpires/otpAttempts). Only the raw code is ever emailed — the DB only
// ever stores a bcrypt hash of it, and it can't be reused after too many
// wrong attempts or after it's been consumed.

const lastOtpSentAt = new Map(); // in-memory resend-cooldown tracker (per user id)

const assertResendCooldown = (userId) => {
    const last = lastOtpSentAt.get(userId);
    if (last && Date.now() - last < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
        const wait = Math.ceil((OTP_RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - last)) / 1000);
        throw Object.assign(new Error(`Please wait ${wait}s before requesting another code.`), { status: 429 });
    }
    lastOtpSentAt.set(userId, Date.now());
};

// Issues (or re-issues) a 6-digit OTP for the given purpose and emails it.
export const issueEmailOtp = async (user, purpose, { skipCooldown = false } = {}) => {
    if (!skipCooldown) assertResendCooldown(user.id);

    const code = generateOtpCode();
    console.log(`[DEV ONLY] OTP Code for ${user.email}: ${code} (Purpose: ${purpose})`);
    const otpCodeHash = await hashOtpCode(code);

    await userRepo().update(user.id, {
        otpCodeHash,
        otpPurpose: purpose,
        otpExpires: otpExpiryDate(),
        otpAttempts: 0,
        otpResetProofToken: null,
        otpResetProofExpires: null,
    });

    await sendOtpEmail(user, code, purpose);
    return { message: "Verification code sent." };
};

// POST /auth/register (registration) -> called by studio.service.js
export const issueRegistrationOtp = async (user) => issueEmailOtp(user, "email_verification", { skipCooldown: true });

// POST /auth/send-otp — resend for either purpose
export const resendOtp = async (email, purpose) => {
    const repo = userRepo();
    const user = await repo.findOne({ where: { email: email.trim().toLowerCase() } });

    // Don't reveal whether the account exists / its verification state
    if (!user) return { message: "If that account exists, a new code has been sent." };
    if (purpose === "email_verification" && user.isEmailVerified) {
        return { message: "If that account exists, a new code has been sent." };
    }

    await issueEmailOtp(user, purpose);
    return { message: "If that account exists, a new code has been sent." };
};

// POST /auth/verify-otp
// For "email_verification": marks the user verified.
// For "password_reset": returns a short-lived proof token used by the
// following "reset-password-otp" step (so the OTP itself is single-use and
// the final password-set step can't be replayed with the same code).
export const verifyEmailOtp = async (email, code, purpose) => {
    const repo = userRepo();
    const user = await repo.findOne({ where: { email: (email || "").trim().toLowerCase() } });

    if (!user || !user.otpCodeHash || user.otpPurpose !== purpose) {
        throw Object.assign(new Error("Invalid or expired code."), { status: 400 });
    }
    if (user.otpExpires && new Date(user.otpExpires) < new Date()) {
        throw Object.assign(new Error("This code has expired. Please request a new one."), { status: 400 });
    }
    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
        throw Object.assign(new Error("Too many incorrect attempts. Please request a new code."), { status: 429 });
    }

    const isMatch = await compareOtpCode(code, user.otpCodeHash);
    if (!isMatch) {
        await repo.update(user.id, { otpAttempts: user.otpAttempts + 1 });
        throw Object.assign(new Error("Incorrect code. Please try again."), { status: 400 });
    }

    if (purpose === "email_verification") {
        await repo.update(user.id, {
            isEmailVerified: true,
            otpCodeHash: null,
            otpPurpose: null,
            otpExpires: null,
            otpAttempts: 0,
        });
        return { message: "Email verified successfully.", verified: true };
    }

    // password_reset — issue a short-lived proof token for the final step
    const proofToken = generateProofToken();
    await repo.update(user.id, {
        otpCodeHash: null,
        otpAttempts: 0,
        otpResetProofToken: proofToken,
        otpResetProofExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 min
    });
    return { message: "Code verified.", resetToken: proofToken };
};

// POST /auth/forgot-password (OTP flavor)
export const requestPasswordResetOtp = async (email) => {
    const repo = userRepo();
    const user = await repo.findOne({ where: { email: (email || "").trim().toLowerCase() } });

    // Don't reveal whether the account exists
    if (!user) return { message: "If that email is registered, a code has been sent." };

    await issueEmailOtp(user, "password_reset");
    return { message: "If that email is registered, a code has been sent." };
};

// POST /auth/reset-password-otp — final step, using the proof token from verifyEmailOtp
export const resetPasswordWithOtpProof = async (resetToken, newPassword) => {
    if (!newPassword || newPassword.length < 6) {
        throw Object.assign(new Error("Password must be at least 6 characters."), { status: 400 });
    }

    const repo = userRepo();
    const user = await repo.findOne({ where: { otpResetProofToken: resetToken } });

    if (!user) {
        throw Object.assign(new Error("Invalid or already-used reset session. Please request a new code."), { status: 400 });
    }
    if (user.otpResetProofExpires && new Date(user.otpResetProofExpires) < new Date()) {
        throw Object.assign(new Error("Reset session expired. Please request a new code."), { status: 400 });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.otpResetProofToken = null;
    user.otpResetProofExpires = null;
    user.mustSetPassword = false;
    user.isEmailVerified = true; // proof of email ownership via OTP
    await repo.save(user);

    return { message: "Password updated successfully. You can now log in." };
};
