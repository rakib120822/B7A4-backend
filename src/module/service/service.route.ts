import { Router } from "express";
import serviceController from "./service.controller";
import { auth, authOptional } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// Get all services (public/filtered based on role)
router.get("/", authOptional(), serviceController.getService);

// Get my services (technician only - must be before /:id route)
router.get(
  "/my-services",
  auth(Role.TECHNICIAN),
  serviceController.getMyServices,
);

// Create new service
router.post("/", auth(Role.TECHNICIAN), serviceController.createService);

// Get service by ID
router.get("/:id", serviceController.getServiceById);

// Update service
router.patch(
  "/:id",
  auth(Role.TECHNICIAN),
  serviceController.updateService,
);

const serviceRoutes = router;
export default serviceRoutes;
