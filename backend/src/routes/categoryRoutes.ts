import { Router } from "express";
import { CategoryController } from "../controllers/categoryController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const staff = [requireAuth, requireRole("moderator", "admin")];

router.get("/", CategoryController.getAll);
router.get("/:id", CategoryController.getById);
router.post("/", ...staff, CategoryController.create);
router.patch("/:id", ...staff, CategoryController.update);
router.delete("/:id", ...staff, CategoryController.delete);

export default router;