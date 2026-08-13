import { Router } from "express";
import serviceController from "./service.controller";
import { auth, authOptional } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get("/", authOptional(), serviceController.getService);
router.post("/", auth(Role.TECHNICIAN), serviceController.createService);
router.get("/:id",serviceController.getServiceById);
router.patch("/:id",auth(Role.TECHNICIAN),serviceController.updateService);


const serviceRoutes = router;
export default serviceRoutes;
