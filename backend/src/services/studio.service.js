import { AppDataSource } from "../config/data-source.js";
import { Studio } from "../models/Studio.js";
import { User } from "../models/User.js";
import { hashPassword, issueRegistrationOtp } from "./auth.service.js";
import { signAccessToken, signRefreshToken } from "../middleware/auth.middleware.js";
import { resolvePermissions } from "../config/permissions.js";
import { sendWelcomeEmail } from "./email.service.js";
import { assignDefaultTrialPlan } from "./subscription.service.js";

// ── REGISTER (Studio + Admin User — single transaction) ──────────────────────
export const registerStudioWithAdmin = async (studioData, userData) => {
    const { savedStudio, savedUser } = await AppDataSource.transaction(async (manager) => {
        // 1. Create the studio
        const studio = manager.create(Studio, studioData);
        const savedStudio = await manager.save(Studio, studio);

        // 2. Hash password and create the admin user
        const passwordHash = await hashPassword(userData.password);
        const user = manager.create(User, {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            passwordHash,
            role: "studio_admin",
            studioId: savedStudio.id,
        });
        const savedUser = await manager.save(User, user);

        return { savedStudio, savedUser };
    });

    // 3. Build token pair for immediate use after registration
    const tokenPayload = {
        id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
        studioId: savedUser.studioId,
        permissions: resolvePermissions(savedUser.role, savedUser.permissions),
    };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ id: savedUser.id });

    // 4. Fire off the OTP verification email + welcome email (non-blocking failures)
    issueRegistrationOtp(savedUser).catch((e) => console.error("Verification OTP email failed:", e.message));
    sendWelcomeEmail(savedUser, savedStudio.studioName).catch((e) => console.error("Welcome email failed:", e.message));

    // 5. Every new studio starts on the Free Trial plan (30 days, all features)
    assignDefaultTrialPlan(savedStudio.id).catch((e) => console.error("Trial plan assignment failed:", e.message));

    // Strip passwordHash from returned user
    const { passwordHash: _ph, ...safeUser } = savedUser;

    return {
        studio: savedStudio,
        user: safeUser,
        accessToken,
        refreshToken,
    };
};

// ── READ ALL ─────────────────────────────────────────────────────────────────
export const getAllStudios = async () => {
    return await AppDataSource.getRepository(Studio).find({
        relations: { users: true },
    });
};

// ── READ ONE ─────────────────────────────────────────────────────────────────
export const getStudioById = async (id) => {
    const studio = await AppDataSource.getRepository(Studio).findOne({
        where: { id: parseInt(id) },
        relations: { users: true },
    });
    if (!studio) throw new Error(`Studio with id ${id} not found`);
    return studio;
};

// ── UPDATE ───────────────────────────────────────────────────────────────────
export const updateStudio = async (id, data) => {
    const repo = AppDataSource.getRepository(Studio);
    const studio = await repo.findOne({ where: { id: parseInt(id) } });
    if (!studio) throw new Error(`Studio with id ${id} not found`);
    Object.assign(studio, data);
    return await repo.save(studio);
};

// ── DELETE ───────────────────────────────────────────────────────────────────
export const deleteStudio = async (id) => {
    const repo = AppDataSource.getRepository(Studio);
    const studio = await repo.findOne({ where: { id: parseInt(id) } });
    if (!studio) throw new Error(`Studio with id ${id} not found`);
    await repo.remove(studio);
    return { message: `Studio ${id} deleted successfully` };
};
