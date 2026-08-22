import { Router } from "express";
import { CategoryController } from "../controllers/categoryController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", CategoryController.getAll);
router.get("/:id", CategoryController.getById);
router.post("/", requireAuth, CategoryController.create);

export default router;