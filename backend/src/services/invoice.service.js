import { AppDataSource } from "../config/data-source.js";
import { Invoice } from "../models/Invoice.js";

const repo = () => AppDataSource.getRepository(Invoice);

/**
 * Strip plain-object relation values — TypeORM EntitySchema throws
 * "given value must be instance of entity class" when a plain object
 * is passed for a relation field.
 */
const sanitize = (data) => {
    const out = {};
    for (const [key, val] of Object.entries(data)) {
        if (val === null || val === undefined) { out[key] = val; continue; }
        if (typeof val !== "object" || Array.isArray(val) || val instanceof Date) {
            out[key] = val;
        }
    }
    return out;
};

const autoNumber = async (studioId) => {
    const count = await repo().count({ where: { studioId } });
    return `INV-${studioId}-${String(count + 1).padStart(4, "0")}`;
};

export const invoiceService = {
    getAll: async (studioId) => repo().find({ where: { studioId } }),

    getById: async (id, studioId) => {
        const item = await repo().findOne({ where: { id: parseInt(id), studioId } });
        if (!item) throw Object.assign(new Error("Invoice not found"), { status: 404 });
        return item;
    },

    create: async (data) => {
        const r = repo();
        const clean = sanitize(data);
        // Auto-generate invoiceNumber if not provided
        if (!clean.invoiceNumber) {
            clean.invoiceNumber = await autoNumber(clean.studioId);
        }
        const item = r.create(clean);
        return r.save(item);
    },

    update: async (id, studioId, data) => {
        const r = repo();
        const item = await r.findOne({ where: { id: parseInt(id), studioId } });
        if (!item) throw Object.assign(new Error("Invoice not found"), { status: 404 });
        Object.assign(item, sanitize(data));
        return r.save(item);
    },

    remove: async (id, studioId) => {
        const r = repo();
        const item = await r.findOne({ where: { id: parseInt(id), studioId } });
        if (!item) throw Object.assign(new Error("Invoice not found"), { status: 404 });
        await r.remove(item);
        return { message: "Invoice deleted successfully" };
    },
};
