import { Router } from "express";
import authController from "./auth.controller";

const router: Router = Router();

router.post("/login", authController.login);

const authRoutes = router;
export default authRoutes;
