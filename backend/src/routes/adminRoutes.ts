import { Router } from "express";
import { AdminController } from "../controllers/adminController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
const staff = [requireAuth, requireRole("moderator", "admin")];
const adminOnly = [requireAuth, requireRole("admin")];

router.get("/overview", ...staff, AdminController.overview);
router.get("/reservations", ...staff, AdminController.reservations);
router.patch("/reservations/:id", ...staff, AdminController.updateReservation);
router.get("/users", ...adminOnly, AdminController.users);
router.get("/messages", ...staff, AdminController.messages);
router.patch("/messages/:id/read", ...staff, AdminController.markMessageRead);
router.get("/audit", ...staff, AdminController.audit);

export default router;
