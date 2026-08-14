import { Router } from "express";

import paymentController from "./payment.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";


const router: Router = Router();

// Create checkout session
router.post(
  "/checkout/:id",
  auth(Role.CUSTOMER),
  paymentController.checkout,
);

// Get all payments for the current user
router.get(
  "/my-payments",
  auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
  paymentController.getMyPayments,
);

// Get all payments (admin only)
router.get("/", auth(Role.ADMIN), paymentController.getAllPayments);

// Get payment by ID
router.get("/:id", auth(Role.ADMIN), paymentController.getPaymentById);

const paymentRoutes = router;
export default paymentRoutes;
