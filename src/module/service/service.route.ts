import { Router } from "express";
import serviceController from "./service.controller";

const router = Router();

router.post("/", serviceController.createService);

const serviceRoutes = router;
export default serviceRoutes;
