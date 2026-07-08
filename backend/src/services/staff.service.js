import crypto from "crypto";
import { AppDataSource } from "../config/data-source.js";
import { User } from "../models/User.js";
import { Studio } from "../models/Studio.js";
import { hashPassword } from "./auth.service.js";
import { sendStaffInviteEmail } from "./email.service.js";
import { ROLES, resolvePermissions } from "../config/permissions.js";
import { checkUserLimit } from "./subscription.service.js";

const userRepo = () => AppDataSource.getRepository(User);
const studioRepo = () => AppDataSource.getRepository(Studio);

const sanitize = (user) => {
    const { passwordHash, emailVerificationToken, passwordResetToken, ...safe } = user;
    return { ...safe, effectivePermissions: resolvePermissions(user.role, user.permissions) };
};

// ── LIST ─────────────────────────────────────────────────────────────────────
export const listStaff = async (studioId) => {
    const staff = await userRepo().find({
        where: { studioId },
        order: { createdAt: "DESC" },
    });
    return staff.map(sanitize);
};

// ── GET ONE ──────────────────────────────────────────────────────────────────
export const getStaffById = async (id, studioId) => {
    const user = await userRepo().findOne({ where: { id, studioId } });
    if (!user) throw Object.assign(new Error("Staff member not found."), { status: 404 });
    return sanitize(user);
};

// ── INVITE ───────────────────────────────────────────────────────────────────
export const inviteStaff = async (data, studioId, invitedBy) => {
    const { firstName, lastName, email, role, phone, jobTitle, department, employeeId, hireDate } = data;

    if (!firstName || !lastName || !email || !role) {
        throw Object.assign(new Error("firstName, lastName, email and role are required."), { status: 400 });
    }
    if (!ROLES.includes(role)) {
        throw Object.assign(new Error(`Invalid role. Must be one of: ${ROLES.join(", ")}`), { status: 400 });
    }

    // Hard enforcement: block adding staff once the studio's plan user limit
    // (+ any purchased extra seats) is reached. See subscription.service.js.
    const limitCheck = await checkUserLimit(studioId);
    if (!limitCheck.allowed) {
        throw Object.assign(new Error(limitCheck.reason || "User limit reached for your current plan."), {
            status: 402, // Payment Required — signals "upgrade/pay to proceed" to the frontend
            code: "USER_LIMIT_REACHED",
            details: limitCheck,
        });
    }

    const repo = userRepo();
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await repo.findOne({ where: { email: normalizedEmail } });
    if (existing) {
        throw Object.assign(new Error("A user with this email already exists."), { status: 409 });
    }

    // Temporary random password — the invitee sets their own via email link
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const passwordHash = await hashPassword(tempPassword);

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = repo.create({
        firstName,
        lastName,
        email: normalizedEmail,
        passwordHash,
        role,
        studioId,
        phone: phone || null,
        jobTitle: jobTitle || null,
        department: department || null,
        employeeId: employeeId || null,
        hireDate: hireDate || null,
        status: "active",
        isActive: true,
        isEmailVerified: false,
        mustSetPassword: true,
        invitedBy: invitedBy?.id || null,
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
    });

    const saved = await repo.save(user);

    const studio = await studioRepo().findOne({ where: { id: studioId } });
    const invitedByName = invitedBy ? `${invitedBy.firstName || ""} ${invitedBy.lastName || ""}`.trim() : null;

    await sendStaffInviteEmail(saved, resetToken, studio?.studioName || "your studio", invitedByName);

    return sanitize(saved);
};

// ── UPDATE PROFILE ───────────────────────────────────────────────────────────
export const updateStaff = async (id, studioId, data) => {
    const repo = userRepo();
    const user = await repo.findOne({ where: { id, studioId } });
    if (!user) throw Object.assign(new Error("Staff member not found."), { status: 404 });

    const allowed = ["firstName", "lastName", "phone", "jobTitle", "department", "employeeId", "hireDate"];
    for (const key of allowed) {
        if (data[key] !== undefined) user[key] = data[key];
    }

    const saved = await repo.save(user);
    return sanitize(saved);
};

// ── UPDATE ROLE ──────────────────────────────────────────────────────────────
export const updateStaffRole = async (id, studioId, role) => {
    if (!ROLES.includes(role)) {
        throw Object.assign(new Error(`Invalid role. Must be one of: ${ROLES.join(", ")}`), { status: 400 });
    }
    const repo = userRepo();
    const user = await repo.findOne({ where: { id, studioId } });
    if (!user) throw Object.assign(new Error("Staff member not found."), { status: 404 });

    user.role = role;
    const saved = await repo.save(user);
    return sanitize(saved);
};

// ── UPDATE PERMISSION OVERRIDES ───────────────────────────────────────────────
// body: { grant?: string[], revoke?: string[] }
export const updateStaffPermissions = async (id, studioId, overrides) => {
    const repo = userRepo();
    const user = await repo.findOne({ where: { id, studioId } });
    if (!user) throw Object.assign(new Error("Staff member not found."), { status: 404 });

    user.permissions = JSON.stringify({
        grant: overrides?.grant || [],
        revoke: overrides?.revoke || [],
    });
    const saved = await repo.save(user);
    return sanitize(saved);
};

// ── UPDATE STATUS (active / on_leave / suspended / inactive) ─────────────────
export const updateStaffStatus = async (id, studioId, status) => {
    const VALID = ["active", "on_leave", "suspended", "inactive"];
    if (!VALID.includes(status)) {
        throw Object.assign(new Error(`Invalid status. Must be one of: ${VALID.join(", ")}`), { status: 400 });
    }
    const repo = userRepo();
    const user = await repo.findOne({ where: { id, studioId } });
    if (!user) throw Object.assign(new Error("Staff member not found."), { status: 404 });

    user.status = status;
    user.isActive = status === "active" || status === "on_leave";
    const saved = await repo.save(user);
    return sanitize(saved);
};

// ── REMOVE ───────────────────────────────────────────────────────────────────
export const removeStaff = async (id, studioId, requesterId) => {
    if (id === requesterId) {
        throw Object.assign(new Error("You cannot remove your own account."), { status: 400 });
    }
    const repo = userRepo();
    const user = await repo.findOne({ where: { id, studioId } });
    if (!user) throw Object.assign(new Error("Staff member not found."), { status: 404 });

    await repo.remove(user);
    return { message: "Staff member removed successfully." };
};

// ── RESEND INVITE ─────────────────────────────────────────────────────────────
export const resendInvite = async (id, studioId) => {
    const repo = userRepo();
    const user = await repo.findOne({ where: { id, studioId } });
    if (!user) throw Object.assign(new Error("Staff member not found."), { status: 404 });
    if (!user.mustSetPassword) {
        throw Object.assign(new Error("This staff member has already set their password."), { status: 400 });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await repo.save(user);

    const studio = await studioRepo().findOne({ where: { id: studioId } });
    await sendStaffInviteEmail(user, resetToken, studio?.studioName || "your studio", null);

    return { message: "Invite resent." };
};
