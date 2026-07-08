import express from "express";
import { Equipment } from "../models/Equipment.js";
import { makeCrudService } from "../services/crud.service.js";
import { makeCrudController } from "../controllers/crud.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { checkSubscriptionActive } from "../middleware/subscription.middleware.js";

const router = express.Router();
const service = makeCrudService(Equipment, "Equipment");
const ctrl    = makeCrudController(service);

router.use(authenticate, checkSubscriptionActive);
router.get("/",     ctrl.getAll);
router.get("/:id",  ctrl.getById);
router.post("/",    ctrl.create);
router.put("/:id",  ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
