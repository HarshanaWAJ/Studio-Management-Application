export const makeCrudController = (service) => ({
    getAll: async (req, res) => {
        try {
            const items = await service.getAll(req.user.studioId);
            res.json(items);
        } catch (e) { console.error("[CRUD getAll]", e); res.status(e.status || 500).json({ message: e.message }); }
    },
    getById: async (req, res) => {
        try {
            const item = await service.getById(req.params.id, req.user.studioId);
            res.json(item);
        } catch (e) { console.error("[CRUD getById]", e); res.status(e.status || 500).json({ message: e.message }); }
    },
    create: async (req, res) => {
        try {
            const item = await service.create({ ...req.body, studioId: req.user.studioId });
            res.status(201).json(item);
        } catch (e) { console.error("[CRUD create]", e); res.status(e.status || 500).json({ message: e.message }); }
    },
    update: async (req, res) => {
        try {
            const item = await service.update(req.params.id, req.user.studioId, req.body);
            res.json(item);
        } catch (e) { console.error("[CRUD update]", e); res.status(e.status || 500).json({ message: e.message }); }
    },
    remove: async (req, res) => {
        try {
            const result = await service.remove(req.params.id, req.user.studioId);
            res.json(result);
        } catch (e) { console.error("[CRUD remove]", e); res.status(e.status || 500).json({ message: e.message }); }
    },
});

