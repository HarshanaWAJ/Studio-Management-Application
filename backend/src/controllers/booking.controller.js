import { AppDataSource } from "../config/data-source.js";
import { Booking } from "../models/Booking.js";
import { Client } from "../models/Client.js";
import { Studio } from "../models/Studio.js";
import { makeCrudService } from "../services/crud.service.js";
import {
    sendBookingConfirmationEmail,
    sendBookingStatusEmail,
} from "../services/email.service.js";

const service = makeCrudService(Booking, "Booking");
const clientRepo = () => AppDataSource.getRepository(Client);
const studioRepo = () => AppDataSource.getRepository(Studio);

const notify = async (booking, studioId, kind, status) => {
    try {
        const client = booking.clientId
            ? await clientRepo().findOne({ where: { id: booking.clientId, studioId } })
            : null;
        const studio = await studioRepo().findOne({ where: { id: studioId } });
        if (!client) return;

        if (kind === "created") {
            await sendBookingConfirmationEmail(client, booking, studio?.studioName || "your studio");
        } else if (kind === "status") {
            await sendBookingStatusEmail(client, booking, studio?.studioName || "your studio", status);
        }
    } catch (err) {
        // Never let a notification failure break the booking flow
        console.error("[Booking notify]", err.message);
    }
};

export const getAll = async (req, res) => {
    try {
        const items = await service.getAll(req.user.studioId);
        res.json(items);
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

export const getById = async (req, res) => {
    try {
        const item = await service.getById(req.params.id, req.user.studioId);
        res.json(item);
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

export const create = async (req, res) => {
    try {
        const item = await service.create({ ...req.body, studioId: req.user.studioId });
        // Confirmation email fires when the booking is created already-confirmed,
        // otherwise it will fire on the status transition to "confirmed" below.
        if (item.status === "confirmed") {
            notify(item, req.user.studioId, "created");
        }
        res.status(201).json(item);
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

export const update = async (req, res) => {
    try {
        const before = await service.getById(req.params.id, req.user.studioId).catch(() => null);
        const item = await service.update(req.params.id, req.user.studioId, req.body);

        if (before && req.body.status && req.body.status !== before.status) {
            if (req.body.status === "confirmed") {
                notify(item, req.user.studioId, "created");
            } else {
                notify(item, req.user.studioId, "status", req.body.status);
            }
        }
        res.json(item);
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};

export const remove = async (req, res) => {
    try {
        const result = await service.remove(req.params.id, req.user.studioId);
        res.json(result);
    } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
};
