import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");

const ALLOWED_MIME = new Set([
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
]);

const storage = multer.diskStorage({
    destination: (req, _file, cb) => {
        const studioId = req.user?.studioId || "public";
        const dir = path.join(UPLOAD_ROOT, String(studioId));
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
        const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
        cb(null, name);
    },
});

const fileFilter = (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
        return cb(Object.assign(new Error("Only image files are allowed (jpg, png, webp, gif, svg)."), { status: 400 }));
    }
    cb(null, true);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per image
});

// Builds the public URL for a stored file given the request + studioId + filename
export const buildFileUrl = (req, studioId, filename) => {
    const base = process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    return `${base}/uploads/${studioId}/${filename}`;
};

export const UPLOAD_ROOT_DIR = UPLOAD_ROOT;
