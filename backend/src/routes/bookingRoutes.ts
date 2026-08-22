import { Router } from "express";
import { BookingController } from "../controllers/bookingController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/", BookingController.create);
router.get("/", BookingController.getMyBookings);
router.get("/:bookingId", BookingController.getById);
router.patch("/:bookingId/cancel", BookingController.cancel);

export default router;
