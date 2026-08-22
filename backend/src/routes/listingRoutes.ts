import { Router } from "express";
import { ListingController } from "../controllers/listingController.js";
import { SpecializedListingController } from "../controllers/specializedListingController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", ListingController.getAll);
router.get("/:id", ListingController.getById);
router.post("/", requireAuth, ListingController.create);
router.delete("/:id", requireAuth, ListingController.delete);
//specialized listing 
router.post("/:listingId/property", requireAuth, SpecializedListingController.addPropertyDetail);
router.post("/:listingId/vehicle", requireAuth, SpecializedListingController.addVehicleDetail);
router.post("/:listingId/service", requireAuth, SpecializedListingController.addServiceDetail);


export default router;