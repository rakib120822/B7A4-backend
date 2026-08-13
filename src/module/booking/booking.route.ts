import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import bookingController from "./booking.controller";

const router: Router = Router();
router.post(
  "/",
  auth(Role.ADMIN, Role.CUSTOMER, Role.CUSTOMER),
  bookingController.createBooking,
);
router.get(
  "/",
  auth(Role.ADMIN, Role.CUSTOMER, Role.CUSTOMER),
  bookingController.getBookings,
);
router.patch(
  "/:id",
  auth(Role.CUSTOMER, Role.CUSTOMER),
  bookingController.updateBooking,
);
const bookingRoutes = router;
export default bookingRoutes;
