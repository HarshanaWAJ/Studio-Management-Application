import { AppDataSource } from "../config/data-source.js";

/**
 * Strip any plain-object values from data before handing to TypeORM.
 * TypeORM EntitySchema will throw "given value must be instance of entity class"
 * if a relation field contains a plain object literal instead of an entity instance.
 * We only keep primitives, null, undefined, booleans, and arrays (JSON fields).
 */
const sanitize = (data) => {
    const out = {};
    for (const [key, val] of Object.entries(data)) {
        if (val === null || val === undefined) { out[key] = val; continue; }
        if (typeof val !== "object" || Array.isArray(val) || val instanceof Date) {
            out[key] = val;
        }
        // Plain objects (relation entities) are deliberately excluded
    }
    return out;
};

export const makeCrudService = (Entity, entityName) => ({
    getAll: async (studioId) => {
        const repo = AppDataSource.getRepository(Entity);
        return repo.find({ where: { studioId } });
    },
    getById: async (id, studioId) => {
        const repo = AppDataSource.getRepository(Entity);
        const item = await repo.findOne({ where: { id: parseInt(id), studioId } });
        if (!item) throw Object.assign(new Error(`${entityName} not found`), { status: 404 });
        return item;
    },
    create: async (data) => {
        const repo = AppDataSource.getRepository(Entity);
        const item = repo.create(sanitize(data));
        return repo.save(item);
    },
    update: async (id, studioId, data) => {
        const repo = AppDataSource.getRepository(Entity);
        const item = await repo.findOne({ where: { id: parseInt(id), studioId } });
        if (!item) throw Object.assign(new Error(`${entityName} not found`), { status: 404 });
        Object.assign(item, sanitize(data));
        return repo.save(item);
    },
    remove: async (id, studioId) => {
        const repo = AppDataSource.getRepository(Entity);
        const item = await repo.findOne({ where: { id: parseInt(id), studioId } });
        if (!item) throw Object.assign(new Error(`${entityName} not found`), { status: 404 });
        await repo.remove(item);
        return { message: `${entityName} deleted successfully` };
    },
});

