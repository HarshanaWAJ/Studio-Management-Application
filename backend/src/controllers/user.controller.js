import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
} from "../services/user.service.js";

// POST /api/v1/users
export const createUserController = async (req, res) => {
    try {
        const user = await createUser(req.body);
        return res.status(201).json(user);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/v1/users
export const getAllUsersController = async (_req, res) => {
    try {
        const users = await getAllUsers();
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/v1/users/:id
export const getUserByIdController = async (req, res) => {
    try {
        const user = await getUserById(req.params.id);
        return res.status(200).json(user);
    } catch (error) {
        const status = error.message.includes("not found") ? 404 : 500;
        return res.status(status).json({ message: error.message });
    }
};

// PUT /api/v1/users/:id
export const updateUserController = async (req, res) => {
    try {
        const user = await updateUser(req.params.id, req.body);
        return res.status(200).json(user);
    } catch (error) {
        const status = error.message.includes("not found") ? 404 : 500;
        return res.status(status).json({ message: error.message });
    }
};

// DELETE /api/v1/users/:id
export const deleteUserController = async (req, res) => {
    try {
        const result = await deleteUser(req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        const status = error.message.includes("not found") ? 404 : 500;
        return res.status(status).json({ message: error.message });
    }
};
