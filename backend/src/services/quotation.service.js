import { AppDataSource } from "../config/data-source.js";
import { Quotation } from "../models/Quotation.js";
import { Invoice }   from "../models/Invoice.js";

const qRepo = () => AppDataSource.getRepository(Quotation);
const iRepo = () => AppDataSource.getRepository(Invoice);

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
    const count = await qRepo().count({ where: { studioId } });
    return `QUO-${studioId}-${String(count + 1).padStart(4, "0")}`;
};

export const quotationService = {
    getAll: async (studioId) => qRepo().find({ where: { studioId } }),

    getById: async (id, studioId) => {
        const item = await qRepo().findOne({ where: { id: parseInt(id), studioId } });
        if (!item) throw Object.assign(new Error("Quotation not found"), { status: 404 });
        return item;
    },

    create: async (data) => {
        const r = qRepo();
        const clean = sanitize(data);
        // Auto-generate quotationNumber if not provided
        if (!clean.quotationNumber) {
            clean.quotationNumber = await autoNumber(clean.studioId);
        }
        const item = r.create(clean);
        return r.save(item);
    },

    update: async (id, studioId, data) => {
        const r = qRepo();
        const item = await r.findOne({ where: { id: parseInt(id), studioId } });
        if (!item) throw Object.assign(new Error("Quotation not found"), { status: 404 });
        Object.assign(item, sanitize(data));
        return r.save(item);
    },

    remove: async (id, studioId) => {
        const r = qRepo();
        const item = await r.findOne({ where: { id: parseInt(id), studioId } });
        if (!item) throw Object.assign(new Error("Quotation not found"), { status: 404 });
        await r.remove(item);
        return { message: "Quotation deleted successfully" };
    },

    // ── Convert quotation → invoice ─────────────────────────────────────────────
    convert: async (id, studioId) => {
        const r = qRepo();
        const ir = iRepo();

        const quot = await r.findOne({ where: { id: parseInt(id), studioId } });
        if (!quot) throw Object.assign(new Error("Quotation not found"), { status: 404 });
        if (quot.status === "converted") throw Object.assign(new Error("Already converted"), { status: 400 });

        const count = await ir.count({ where: { studioId } });
        const invoiceNumber = `INV-${studioId}-${String(count + 1).padStart(4, "0")}`;

        const invoice = ir.create({
            studioId:       quot.studioId,
            clientId:       quot.clientId,
            invoiceNumber,
            status:         "draft",
            items:          quot.items,
            subtotal:       quot.subtotal,
            taxRate:        quot.taxRate,
            taxAmount:      quot.taxAmount,
            discountAmount: quot.discountAmount,
            totalAmount:    quot.totalAmount,
            notes:          quot.notes,
        });
        const savedInvoice = await ir.save(invoice);

        quot.status = "converted";
        quot.convertedInvoiceId = savedInvoice.id;
        await r.save(quot);

        return { invoice: savedInvoice, quotation: quot };
    },
};
