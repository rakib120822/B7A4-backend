import { Router } from "express";
import categoryController from "./category.controller";

const router: Router = Router();

router.post("/", categoryController.createCategory);

const categoryRoutes = router;
export default categoryRoutes;
