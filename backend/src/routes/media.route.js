import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { checkSubscriptionActive } from "../middleware/subscription.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { uploadImageController } from "../controllers/media.controller.js";

const router = express.Router();

router.use(authenticate, checkSubscriptionActive);

// multipart/form-data, field name "image"
router.post("/upload", upload.single("image"), uploadImageController);

// Multer error handler (wrong file type / too large) → clean JSON instead of HTML stack trace
router.use((err, _req, res, _next) => {
    res.status(err.status || 400).json({ message: err.message || "Upload failed." });
});

export default router;
