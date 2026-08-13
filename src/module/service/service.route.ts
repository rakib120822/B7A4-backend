import { Router } from "express";
import serviceController from "./service.controller";
import { auth, authOptional } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get("/", authOptional(), serviceController.getService);
router.post("/", auth(Role.TECHNICIAN), serviceController.createService);

const serviceRoutes = router;
export default serviceRoutes;
