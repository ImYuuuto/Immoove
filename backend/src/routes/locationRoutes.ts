import { Router } from "express";
import { LocationController } from "../controllers/locationController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const staff = [requireAuth, requireRole("moderator", "admin")];

router.get("/", LocationController.getAll);
router.post("/", ...staff, LocationController.create);
router.patch("/:id", ...staff, LocationController.update);
router.delete("/:id", ...staff, LocationController.delete);

export default router;
