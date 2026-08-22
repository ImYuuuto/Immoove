import { Router } from "express";
import { LocationController } from "../controllers/locationController.js";

const router = Router();

router.get("/", LocationController.getAll);

export default router;
