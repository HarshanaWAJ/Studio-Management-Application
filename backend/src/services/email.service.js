import nodemailer from "nodemailer";
import "dotenv/config";
import { OTP_TTL_MINUTES } from "./otp.util.js";

// ─────────────────────────────────────────────────────────────────────────────
// Gmail SMTP transporter (free tier — an "App Password" is required, not your
// normal Gmail password: https://myaccount.google.com/apppasswords)
//
// Required .env vars:
//   EMAIL_USER            your-studio@gmail.com
//   EMAIL_APP_PASSWORD    16-character Gmail App Password
//   EMAIL_FROM_NAME       "JH Studio" (optional, defaults below)
// ─────────────────────────────────────────────────────────────────────────────

let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        console.warn(
            "⚠️  EMAIL_USER / EMAIL_APP_PASSWORD not set — emails will be logged to console instead of sent."
        );
        return null;
    }

    transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD,
        },
    });

    return transporter;
};

const FROM_NAME = process.env.EMAIL_FROM_NAME || "JH Studio";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ── Base template shell ────────────────────────────────────────────────────
const shell = (title, bodyHtml, ctaLabel, ctaUrl) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0d0c0a;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0c0a;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#161412;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
        <tr><td style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:18px;font-weight:700;color:#f5f5f4;letter-spacing:0.02em;">${FROM_NAME}</span>
        </tr></td>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#fafafa;font-weight:600;">${title}</h1>
          <div style="font-size:14px;line-height:1.6;color:#a1a1aa;">${bodyHtml}</div>
          ${ctaUrl ? `
          <div style="margin-top:28px;">
            <a href="${ctaUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#09090b;text-decoration:none;font-weight:700;font-size:13px;border-radius:10px;">${ctaLabel}</a>
          </div>
          <p style="margin-top:20px;font-size:11px;color:#71717a;word-break:break-all;">Or copy this link: ${ctaUrl}</p>
          ` : ""}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:11px;color:#52525b;">This is an automated message from ${FROM_NAME}. Please don't reply directly to this email.</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Core sender ────────────────────────────────────────────────────────────
export const sendEmail = async ({ to, subject, html }) => {
    const t = getTransporter();

    if (!t) {
        console.log(`\n📧 [DEV EMAIL] To: ${to} | Subject: ${subject}\n${html}\n`);
        return { simulated: true };
    }

    try {
        const info = await t.sendMail({
            from: `"${FROM_NAME}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`✅ Email sent successfully to: ${to} | Subject: ${subject} | MessageId: ${info.messageId}`);
        return { messageId: info.messageId };
    } catch (err) {
        console.error(`❌ Email send failed for: ${to} | Subject: ${subject}`);
        console.error("Reason:", err.message);
        // Don't let a failed email break the calling business flow
        return { error: err.message };
    }
};

// ── Templated sends ──────────────────────────────────────────────────────────

// ── OTP code shell (large, easy-to-read code block instead of a CTA button) ──
const otpShell = (title, bodyHtml, code) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0d0c0a;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0c0a;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#161412;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
        <tr><td style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:18px;font-weight:700;color:#f5f5f4;letter-spacing:0.02em;">${FROM_NAME}</span>
        </tr></td>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:#fafafa;font-weight:600;">${title}</h1>
          <div style="font-size:14px;line-height:1.6;color:#a1a1aa;">${bodyHtml}</div>
          <div style="margin-top:28px;text-align:center;">
            <span style="display:inline-block;padding:16px 32px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#09090b;font-weight:800;font-size:32px;letter-spacing:0.35em;border-radius:12px;">${code}</span>
          </div>
          <p style="margin-top:20px;font-size:12px;color:#71717a;">This code expires in ${OTP_TTL_MINUTES} minutes. If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:11px;color:#52525b;">This is an automated message from ${FROM_NAME}. Please don't reply directly to this email.</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const sendOtpEmail = async (user, code, purpose) => {
    const isReset = purpose === "password_reset";
    return sendEmail({
        to: user.email,
        subject: isReset ? "Your password reset code" : "Your email verification code",
        html: otpShell(
            isReset ? "Reset your password" : `Verify your email, ${user.firstName}!`,
            isReset
                ? `Hi ${user.firstName}, use the code below to reset your password.`
                : `Use the code below to verify your email address and activate your account.`,
            code
        ),
    });
};

export const sendVerificationEmail = async (user, token) => {
    const url = `${FRONTEND_URL}/auth/verify-email?token=${token}`;
    return sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html: shell(
            `Welcome, ${user.firstName}!`,
            `Please confirm your email address to activate your account. This link expires in 24 hours.`,
            "Verify Email",
            url
        ),
    });
};

export const sendPasswordResetEmail = async (user, token) => {
    const url = `${FRONTEND_URL}/auth/reset-password?token=${token}`;
    return sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: shell(
            `Password Reset Requested`,
            `Hi ${user.firstName}, we received a request to reset your password. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.`,
            "Reset Password",
            url
        ),
    });
};

export const sendStaffInviteEmail = async (user, token, studioName, invitedByName) => {
    const url = `${FRONTEND_URL}/auth/reset-password?token=${token}&invite=1`;
    return sendEmail({
        to: user.email,
        subject: `You've been invited to join ${studioName} on ${FROM_NAME}`,
        html: shell(
            `You're invited!`,
            `${invitedByName || "A studio admin"} has added you as <strong>${user.role.replace("_", " ")}</strong> at <strong>${studioName}</strong>. Set your password to activate your account. This link expires in 24 hours.`,
            "Set Your Password",
            url
        ),
    });
};

export const sendBookingConfirmationEmail = async (client, booking, studioName) => {
    if (!client?.email) return { skipped: true };
    const when = new Date(booking.startTime).toLocaleString("en-US", {
        dateStyle: "medium", timeStyle: "short",
    });
    return sendEmail({
        to: client.email,
        subject: `Booking Confirmed — ${booking.title}`,
        html: shell(
            `Your session is confirmed!`,
            `Hi ${client.firstName}, your booking <strong>"${booking.title}"</strong> with <strong>${studioName}</strong> is scheduled for <strong>${when}</strong>. We look forward to seeing you!`,
        ),
    });
};

export const sendBookingStatusEmail = async (client, booking, studioName, status) => {
    if (!client?.email) return { skipped: true };
    const when = new Date(booking.startTime).toLocaleString("en-US", {
        dateStyle: "medium", timeStyle: "short",
    });
    const statusText = {
        confirmed: "confirmed",
        cancelled: "cancelled",
        completed: "marked as completed",
        pending: "moved back to pending",
    }[status] || status;

    return sendEmail({
        to: client.email,
        subject: `Booking Update — ${booking.title}`,
        html: shell(
            `Your booking has been ${statusText}`,
            `Hi ${client.firstName}, your booking <strong>"${booking.title}"</strong> with <strong>${studioName}</strong> (${when}) has been <strong>${statusText}</strong>.`,
        ),
    });
};

export const sendBookingReminderEmail = async (client, booking, studioName) => {
    if (!client?.email) return { skipped: true };
    const when = new Date(booking.startTime).toLocaleString("en-US", {
        dateStyle: "medium", timeStyle: "short",
    });
    return sendEmail({
        to: client.email,
        subject: `Reminder: Upcoming session with ${studioName}`,
        html: shell(
            `Your session is coming up`,
            `Hi ${client.firstName}, this is a friendly reminder about your upcoming session <strong>"${booking.title}"</strong> on <strong>${when}</strong>.`,
        ),
    });
};

export const sendWebsiteInquiryEmail = async (studioAdminEmail, studioName, inquiry) => {
    return sendEmail({
        to: studioAdminEmail,
        subject: `New website inquiry — ${inquiry.name}`,
        html: shell(
            `New inquiry from your website`,
            `<strong>${inquiry.name}</strong> submitted a message via your ${studioName} website.<br/><br/>
             Email: ${inquiry.email}<br/>
             ${inquiry.phone ? `Phone: ${inquiry.phone}<br/>` : ""}
             <br/>"${inquiry.message}"`,
        ),
    });
};

export const sendWelcomeEmail = async (user, studioName) => {
    return sendEmail({
        to: user.email,
        subject: `Welcome to ${studioName}`,
        html: shell(
            `Welcome aboard, ${user.firstName}!`,
            `Your account at <strong>${studioName}</strong> is ready to go. Log in any time to manage bookings, clients, and more.`,
            "Go to Dashboard",
            `${FRONTEND_URL}/auth/login`
        ),
    });
};
