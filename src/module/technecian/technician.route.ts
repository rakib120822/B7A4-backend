import { Router } from "express";
import technicianController from "./technician.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";


const router: Router = Router();

router.post("/", technicianController.createTechnicianProfile);
router.get("/", auth(Role.ADMIN), technicianController.getTechnician);
router.get("/:id", technicianController.getTechnicianById);

const technicianRoutes = router;
export default technicianRoutes;
