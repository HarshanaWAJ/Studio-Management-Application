import {
    listStaff,
    getStaffById,
    inviteStaff,
    updateStaff,
    updateStaffRole,
    updateStaffPermissions,
    updateStaffStatus,
    removeStaff,
    resendInvite,
} from "../services/staff.service.js";
import { ROLES, PERMISSIONS } from "../config/permissions.js";

const handle = (fn) => async (req, res) => {
    try {
        await fn(req, res);
    } catch (error) {
        console.error("[Staff]", error);
        res.status(error.status || 500).json({ message: error.message, code: error.code, details: error.details });
    }
};

export const listStaffController = handle(async (req, res) => {
    const staff = await listStaff(req.user.studioId);
    res.json(staff);
});

export const getStaffController = handle(async (req, res) => {
    const staff = await getStaffById(req.params.id, req.user.studioId);
    res.json(staff);
});

export const inviteStaffController = handle(async (req, res) => {
    const staff = await inviteStaff(req.body, req.user.studioId, req.user);
    res.status(201).json(staff);
});

export const updateStaffController = handle(async (req, res) => {
    const staff = await updateStaff(req.params.id, req.user.studioId, req.body);
    res.json(staff);
});

export const updateStaffRoleController = handle(async (req, res) => {
    const staff = await updateStaffRole(req.params.id, req.user.studioId, req.body.role);
    res.json(staff);
});

export const updateStaffPermissionsController = handle(async (req, res) => {
    const staff = await updateStaffPermissions(req.params.id, req.user.studioId, req.body);
    res.json(staff);
});

export const updateStaffStatusController = handle(async (req, res) => {
    const staff = await updateStaffStatus(req.params.id, req.user.studioId, req.body.status);
    res.json(staff);
});

export const removeStaffController = handle(async (req, res) => {
    const result = await removeStaff(req.params.id, req.user.studioId, req.user.id);
    res.json(result);
});

export const resendInviteController = handle(async (req, res) => {
    const result = await resendInvite(req.params.id, req.user.studioId);
    res.json(result);
});

// GET /api/v1/staff/meta/roles-permissions — powers the frontend role/permission UI
export const rolesAndPermissionsController = handle(async (_req, res) => {
    res.json({ roles: ROLES, permissions: PERMISSIONS });
});
