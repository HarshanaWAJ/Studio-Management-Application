import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { makeCrudController } from "../controllers/crud.controller.js";
import { invoiceService } from "../services/invoice.service.js";

const router = express.Router();
const ctrl   = makeCrudController(invoiceService);

router.use(authenticate);
router.get("/",       ctrl.getAll);
router.get("/:id",    ctrl.getById);
router.post("/",      ctrl.create);
router.put("/:id",    ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
