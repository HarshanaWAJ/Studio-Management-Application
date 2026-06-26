import express from "express";
import cors    from "cors";
import helmet  from "helmet";
import "dotenv/config";

import { AppDataSource } from "./config/data-source.js";
import authRoutes        from "./routes/auth.route.js";
import studioRoutes      from "./routes/studio.route.js";
import userRoutes        from "./routes/user.route.js";

// ── New feature routes ─────────────────────────────────────────────────────────
import bookingRoutes     from "./routes/booking.route.js";
import clientRoutes      from "./routes/client.route.js";
import equipmentRoutes   from "./routes/equipment.route.js";
import packageRoutes     from "./routes/package.route.js";
import invoiceRoutes     from "./routes/invoice.route.js";
import galleryRoutes     from "./routes/gallery.route.js";
import frameRoutes       from "./routes/frame.route.js";
import inventoryRoutes   from "./routes/inventory.route.js";
import quotationRoutes   from "./routes/quotation.route.js";

const app = express();

// ── Security & parsing ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// ── Health ─────────────────────────────────────────────────────────────────────
app.get("/api/v1/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/v1/auth",       authRoutes);
app.use("/api/v1/studios",    studioRoutes);
app.use("/api/v1/users",      userRoutes);
app.use("/api/v1/bookings",   bookingRoutes);
app.use("/api/v1/clients",    clientRoutes);
app.use("/api/v1/equipment",  equipmentRoutes);
app.use("/api/v1/packages",   packageRoutes);
app.use("/api/v1/invoices",   invoiceRoutes);
app.use("/api/v1/galleries",  galleryRoutes);
app.use("/api/v1/frames",     frameRoutes);
app.use("/api/v1/inventory",  inventoryRoutes);
app.use("/api/v1/quotations", quotationRoutes);

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: "Route not found" }));

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
});

// ── Start ──────────────────────────────────────────────────────────────────────
AppDataSource.initialize()
    .then(() => {
        console.log("✅ Database Connected Successfully");
        console.log("Connected Database:", AppDataSource.options.database);
        app.listen(process.env.PORT || 8088, () => {
            console.log(`🚀 Server running on port ${process.env.PORT || 8088}`);
        });
    })
    .catch((error) => {
        console.error("❌ Database Connection Failed");
        console.error(error);
        process.exit(1);
    });
