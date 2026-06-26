import express from "express";
import { Package } from "../models/Package.js";
import { makeCrudService } from "../services/crud.service.js";
import { makeCrudController } from "../controllers/crud.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();
const service = makeCrudService(Package, "Package");
const ctrl    = makeCrudController(service);

router.use(authenticate);
router.get("/",     ctrl.getAll);
router.get("/:id",  ctrl.getById);
router.post("/",    ctrl.create);
router.put("/:id",  ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
