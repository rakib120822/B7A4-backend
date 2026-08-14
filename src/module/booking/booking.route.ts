import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import bookingController from "./booking.controller";

const router: Router = Router();

// Create booking
router.post(
  "/",
  auth(Role.ADMIN, Role.CUSTOMER),
  bookingController.createBooking,
);

// Get technician dashboard bookings (must be before /:id route)
router.get(
  "/technician/dashboard",
  auth(Role.TECHNICIAN),
  bookingController.getTechnicianDashboardBookings,
);

// Get customer bookings
router.get(
  "/",
  auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN),
  bookingController.getBookings,
);

// Update booking status
router.patch(
  "/:id",
  auth(Role.CUSTOMER, Role.TECHNICIAN),
  bookingController.updateBooking,
);

const bookingRoutes = router;
export default bookingRoutes;
