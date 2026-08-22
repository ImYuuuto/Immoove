import { Router } from "express";
import { UserController } from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.post("/logout", UserController.logout);
router.get("/profile", requireAuth, UserController.getProfile);

export default router;
