import { Router } from "express";
import { ListingController } from "../controllers/listingController.js";
import { SpecializedListingController } from "../controllers/specializedListingController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = Router();

router.get("/", optionalAuth, ListingController.getAll);
router.get("/:id", optionalAuth, ListingController.getById);
router.post("/", requireAuth, ListingController.create);
router.patch("/:id", requireAuth, ListingController.update);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("moderator", "admin"),
  ListingController.moderate,
);
router.delete("/:id", requireAuth, ListingController.delete);
router.post("/:listingId/property", requireAuth, SpecializedListingController.addPropertyDetail);
router.post("/:listingId/vehicle", requireAuth, SpecializedListingController.addVehicleDetail);
router.post("/:listingId/service", requireAuth, SpecializedListingController.addServiceDetail);

export default router;
