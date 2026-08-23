import { Router } from "express";
import { SavedListingController } from "../controllers/savedListingController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);
router.get("/", SavedListingController.list);
router.post("/:listingId", SavedListingController.save);
router.delete("/:listingId", SavedListingController.remove);

export default router;
