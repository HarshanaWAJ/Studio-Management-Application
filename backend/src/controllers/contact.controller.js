import { listSubmissions, updateSubmission, removeSubmission, getAnalytics } from "../services/contact.service.js";

const handle = (fn) => async (req, res) => {
    try {
        await fn(req, res);
    } catch (error) {
        console.error("[Contact]", error);
        res.status(error.status || 500).json({ message: error.message });
    }
};

export const getAll = handle(async (req, res) => {
    res.json(await listSubmissions(req.user.studioId, req.query));
});

export const update = handle(async (req, res) => {
    res.json(await updateSubmission(req.params.id, req.user.studioId, req.body));
});

export const remove = handle(async (req, res) => {
    res.json(await removeSubmission(req.params.id, req.user.studioId));
});

export const analytics = handle(async (req, res) => {
    res.json(await getAnalytics(req.user.studioId));
});
