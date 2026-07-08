import express from "express";
import cors    from "cors";
import helmet  from "helmet";
import "dotenv/config";
import { UPLOAD_ROOT_DIR } from "./middleware/upload.middleware.js";

import { AppDataSource } from "./config/data-source.js";
import authRoutes        from "./routes/auth.route.js";
import studioRoutes      from "./routes/studio.route.js";
import userRoutes        from "./routes/user.route.js";
import staffRoutes       from "./routes/staff.route.js";
import aiRoutes          from "./routes/ai.route.js";
import websiteRoutes     from "./routes/website.route.js";
import publicWebsiteRoutes from "./routes/public-website.route.js";
import mediaRoutes       from "./routes/media.route.js";
import contactRoutes     from "./routes/contact.route.js";
import platformAdminRoutes from "./routes/platformAdmin.route.js";
import subscriptionRoutes from "./routes/subscription.route.js";

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

import { seedDefaultPlans } from "./services/plan.service.js";
import { seedDefaultPlatformAdmin } from "./services/platformAuth.service.js";
import { trackUsage, flushUsageBuffer, startUsageFlushInterval } from "./services/usage.service.js";

const app = express();

// ── Security & parsing ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

// Per-studio API request counters for the Super Admin usage dashboard. Placed
// early so it wraps every request; it reads req.user which is populated
// later by each router's own `authenticate` (see services/usage.service.js).
app.use(trackUsage);

// Serve uploaded studio media (logos, hero images, block images, gallery photos)
app.use("/uploads", express.static(UPLOAD_ROOT_DIR));

// ── Health ─────────────────────────────────────────────────────────────────────
app.get("/api/v1/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── SaaS Control Center (Super Admin) — entirely separate auth from studios ──
app.use("/api/v1/platform", platformAdminRoutes);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/v1/auth",       authRoutes);
app.use("/api/v1/studios",    studioRoutes);
app.use("/api/v1/users",      userRoutes);
app.use("/api/v1/staff",      staffRoutes);
app.use("/api/v1/subscription", subscriptionRoutes);
app.use("/api/v1/ai",         aiRoutes);
app.use("/api/v1/website",       websiteRoutes);
app.use("/api/v1/media",         mediaRoutes);
app.use("/api/v1/contact-submissions", contactRoutes);
// Public studio sites can be reached from our own frontend domain OR a
// studio's connected custom domain, so this router gets an open CORS policy —
// it is entirely unauthenticated/public data by design.
app.use("/api/v1/public/website", cors(), publicWebsiteRoutes);
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
    .then(async () => {
        console.log("✅ Database Connected Successfully");
        console.log("Connected Database:", AppDataSource.options.database);

        // One-time / idempotent boot seeding for the SaaS layer
        await seedDefaultPlans();
        await seedDefaultPlatformAdmin();
        startUsageFlushInterval();

        const server = app.listen(process.env.PORT || 8088, () => {
            console.log(`🚀 Server running on port ${process.env.PORT || 8088}`);
        });

        const shutdown = async () => {
            console.log("Shutting down — flushing usage counters...");
            await flushUsageBuffer().catch(() => {});
            server.close(() => process.exit(0));
        };
        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    })
    .catch((error) => {
        console.error("❌ Database Connection Failed");
        console.error(error);
        process.exit(1);
    });
