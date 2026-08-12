import { Router } from "express";
import userController from "./user.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router: Router = Router();

router.post("/", userController.registerUser);
router.get(
  "/",
  auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN),
  userController.getProfile,
);
router.patch(
  "/",
  auth(Role.ADMIN, Role.CUSTOMER, Role.TECHNICIAN),
  userController.getProfile,
);

router.patch("/:id", auth(Role.ADMIN), userController.blockedUser);

const userRoutes = router;
export default userRoutes;
