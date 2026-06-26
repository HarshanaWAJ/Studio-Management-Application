import { AppDataSource } from "../config/data-source.js";
import { User } from "../models/User.js";
import { hashPassword } from "./auth.service.js";

const userRepo = () => AppDataSource.getRepository(User);

// ── CREATE ──────────────────────────────────────────────────────────────────
export const createUser = async (data) => {
    const repo = userRepo();

    const user = repo.create({
        ...data,
        email: data.email.trim().toLowerCase(),
        passwordHash: await hashPassword(data.password),
    });

    delete user.password;

    return await repo.save(user);
};

// ── READ ALL ────────────────────────────────────────────────────────────────
export const getAllUsers = async () => {
    return await userRepo().find({ relations: { studio: true } });
};

// ── READ ONE ────────────────────────────────────────────────────────────────
export const getUserById = async (id) => {
    const user = await userRepo().findOne({
        where: { id },
        relations: { studio: true },
    });
    if (!user) throw new Error(`User with id ${id} not found`);
    return user;
};

// ── UPDATE ──────────────────────────────────────────────────────────────────
export const updateUser = async (id, data) => {
    const repo = userRepo();
    const user = await repo.findOne({ where: { id } });
    if (!user) throw new Error(`User with id ${id} not found`);
    // Prevent overwriting passwordHash directly through update
    const { passwordHash, ...safeData } = data;
    Object.assign(user, safeData);
    return await repo.save(user);
};

// ── DELETE ──────────────────────────────────────────────────────────────────
export const deleteUser = async (id) => {
    const repo = userRepo();
    const user = await repo.findOne({ where: { id } });
    if (!user) throw new Error(`User with id ${id} not found`);
    await repo.remove(user);
    return { message: `User ${id} deleted successfully` };
};
