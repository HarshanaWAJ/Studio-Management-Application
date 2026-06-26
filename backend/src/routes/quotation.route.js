import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { makeCrudController } from "../controllers/crud.controller.js";
import { quotationService } from "../services/quotation.service.js";

const router = express.Router();
const ctrl   = makeCrudController(quotationService);

router.use(authenticate);
router.get("/",       ctrl.getAll);
router.get("/:id",    ctrl.getById);
router.post("/",      ctrl.create);
router.put("/:id",    ctrl.update);
router.delete("/:id", ctrl.remove);

// ── Convert quotation → invoice ───────────────────────────────────────────────
router.post("/:id/convert", async (req, res) => {
    try {
        const result = await quotationService.convert(req.params.id, req.user.studioId);
        res.status(201).json(result);
    } catch (e) {
        console.error("[Quotation convert]", e);
        res.status(e.status || 500).json({ message: e.message });
    }
});

export default router;
