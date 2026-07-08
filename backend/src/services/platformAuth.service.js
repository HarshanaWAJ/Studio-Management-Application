import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source.js";
import { PlatformAdmin } from "../models/PlatformAdmin.js";

const PLATFORM_SECRET = process.env.PLATFORM_JWT_SECRET;
const TOKEN_EXPIRES = "12h";

const adminRepo = () => AppDataSource.getRepository(PlatformAdmin);

const sanitize = (admin) => {
    const { passwordHash, ...safe } = admin;
    return safe;
};

// Signs a platform-scoped JWT using a DIFFERENT secret than studio user
// tokens (see middleware/auth.middleware.js). This means a platform admin
// token is structurally rejected by every studio data route's `authenticate`
// middleware, and vice versa — the isolation is enforced by cryptography,
// not just an `if (role === ...)` check.
const signPlatformToken = (admin) =>
    jwt.sign({ id: admin.id, email: admin.email, scope: "platform" }, PLATFORM_SECRET, { expiresIn: TOKEN_EXPIRES });

// Idempotent — called once on server boot (see server.js). Creates the one
// initial Super Admin account from env vars if none exists yet.
export const seedDefaultPlatformAdmin = async () => {
    const repo = adminRepo();
    const count = await repo.count();
    if (count > 0) return;

    const email = (process.env.PLATFORM_ADMIN_EMAIL || "").trim().toLowerCase();
    const password = process.env.PLATFORM_ADMIN_PASSWORD;
    if (!email || !password) {
        console.warn("PLATFORM_ADMIN_EMAIL/PLATFORM_ADMIN_PASSWORD not set — skipping Super Admin seed.");
        return;
    }

    const [firstName, ...rest] = (process.env.PLATFORM_ADMIN_NAME || "Platform Owner").split(" ");
    const passwordHash = await bcrypt.hash(password, 10);

    await repo.save(
        repo.create({
            firstName: firstName || "Platform",
            lastName: rest.join(" ") || "Owner",
            email,
            passwordHash,
            isActive: true,
        })
    );
    console.log(`Seeded Super Admin account: ${email} (change the password after first login!)`);
};

export const platformLogin = async (email, password) => {
    const repo = adminRepo();
    const admin = await repo.findOne({ where: { email: (email || "").trim().toLowerCase() } });
    if (!admin || !admin.isActive) {
        throw Object.assign(new Error("Invalid credentials."), { status: 401 });
    }

    const match = await bcrypt.compare(password || "", admin.passwordHash);
    if (!match) throw Object.assign(new Error("Invalid credentials."), { status: 401 });

    const token = signPlatformToken(admin);
    return { token, admin: sanitize(admin) };
};

export const getPlatformAdminById = async (id) => {
    const admin = await adminRepo().findOne({ where: { id } });
    return admin ? sanitize(admin) : null;
};

export const changePlatformAdminPassword = async (id, currentPassword, newPassword) => {
    const repo = adminRepo();
    const admin = await repo.findOne({ where: { id } });
    if (!admin) throw Object.assign(new Error("Admin not found."), { status: 404 });

    const match = await bcrypt.compare(currentPassword || "", admin.passwordHash);
    if (!match) throw Object.assign(new Error("Current password is incorrect."), { status: 401 });
    if (!newPassword || newPassword.length < 8) {
        throw Object.assign(new Error("New password must be at least 8 characters."), { status: 400 });
    }

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    await repo.save(admin);
    return { message: "Password updated." };
};
