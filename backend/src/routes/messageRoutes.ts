import { Router } from "express";
import { MessageController } from "../controllers/messageController.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.post("/", optionalAuth, MessageController.create);
router.get("/mine", requireAuth, MessageController.mine);

export default router;
