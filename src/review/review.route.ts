import { Router } from "express";
import { auth } from "../middleware/auth";
import { Role } from "../../generated/prisma/enums";
import reviewController from "./review.controller";

const router: Router = Router();

router.post(
  "/",
  auth(Role.CUSTOMER),
  reviewController.createReview,
);

router.get(
  "/technician/:technicianId",
  reviewController.getReviews,
);

router.patch(
  "/:id",
  auth(Role.CUSTOMER),
  reviewController.updateReview,
);

router.delete(
  "/:id",
  auth(Role.CUSTOMER, Role.ADMIN),
  reviewController.deleteReview,
);

const reviewRoutes = router;
export default reviewRoutes;
