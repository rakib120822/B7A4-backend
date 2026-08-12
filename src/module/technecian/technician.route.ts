import { Router } from "express";
import technicianController from "./technician.controller";

const router: Router = Router();

router.post("/", technicianController.createTechnicianProfile);

const technicianRoutes = router;
export default technicianRoutes;
