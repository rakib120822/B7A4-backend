import { Router } from "express";
import userController from "./user.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router: Router = Router();

router.post("/", userController.registerUser);

// Get all users (admin only) - must be before other GET routes to avoid conflicts
router.get(
  "/",
  auth(Role.ADMIN),
  userController.getAllUsers,
);

router.get(
  "/me",
  auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN),
  userController.getProfile,
);

router.patch(
  "/",
  auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN),
  userController.updateProfile,
);

router.patch("/:id", auth(Role.ADMIN), userController.blockedUser);

const userRoutes = router;
export default userRoutes;
