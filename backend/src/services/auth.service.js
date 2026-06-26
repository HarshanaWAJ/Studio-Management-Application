import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/data-source.js";
import { User } from "../models/User.js";

const userRepo = () => AppDataSource.getRepository(User);

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// ── Helpers ──────────────────────────────────────────────────────────────────

export const hashPassword = async (plainPassword) => {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(plainPassword, salt);
};

const buildTokenPair = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        studioId: user.studioId,
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
    const { passwordHash, ...safe } = user;
    return safe;
};

// ── login ────────────────────────────────────────────────────────────────────
export const login = async (email, password) => {
    email = email.trim().toLowerCase();

    console.log("Login Email:", email);

    const user = await userRepo().findOne({
        where: { email },
        relations: {
            studio: true,
        },
    });

    console.log("User Found:", !!user);

    if (!user) {
        throw Object.assign(new Error("Invalid email or password."), {
            status: 401,
        });
    }

    console.log("Stored Hash:", user.passwordHash);

    if (!user.isActive) {
        throw Object.assign(new Error("Account is deactivated."), {
            status: 403,
        });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    console.log("Password Match:", isMatch);

    if (!isMatch) {
        throw Object.assign(new Error("Invalid email or password."), {
            status: 401,
        });
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
