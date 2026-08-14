import { Router } from "express";

import paymentController from "./payment.controller";
import { auth } from "../middleware/auth";
import { Role } from "../../generated/prisma/enums";

const router: Router = Router();

// Webhook route (no auth required)
router.post("/webhook", paymentController.webhook);

// Create checkout session
router.post(
  "/checkout/:userId",
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
router.get("/:paymentId", auth(Role.ADMIN), paymentController.getPaymentById);

const paymentRoutes = router;
export default paymentRoutes;
