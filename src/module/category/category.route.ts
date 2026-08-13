import { Router } from "express";
import categoryController from "./category.controller";
import { auth, authOptional } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router: Router = Router();

router.get("/", authOptional(), categoryController.getCategory);
router.get(
  "/:id",
  auth(Role.ADMIN, Role.TECHNICIAN),
  categoryController.getCategoryById,
);
router.post("/", auth(Role.ADMIN), categoryController.createCategory);
router.patch("/", auth(Role.ADMIN), categoryController.updateCategory);

const categoryRoutes = router;
export default categoryRoutes;
