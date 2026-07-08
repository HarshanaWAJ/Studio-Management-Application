import { buildFileUrl } from "../middleware/upload.middleware.js";

export const uploadImageController = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No image file provided (field name: 'image')." });
    }
    const url = buildFileUrl(req, req.user.studioId, req.file.filename);
    res.status(201).json({
        url,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
    });
};
