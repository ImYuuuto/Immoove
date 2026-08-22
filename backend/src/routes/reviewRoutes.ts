// src/routes/reviewRoutes.ts
import { Router } from "express";
import { ReviewController } from "../controllers/reviewController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, ReviewController.create);
router.get("/listing/:listingId", ReviewController.getByListing);

export default router;