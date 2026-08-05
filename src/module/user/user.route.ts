import { Router } from "express";
import userController from "./user.controller";

const router: Router = Router();

router.post("/", userController.registerUser);

const userRoutes = router;
export default userRoutes;
