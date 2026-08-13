import express, { type Application } from "express";
import { prisma } from "./lib/prisma";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./module/user/user.route";
import globalError from "./middleware/globalErrorHandler";
import authRoutes from "./module/auth/auth.route";
import categoryRoutes from "./module/category/category.route";
import technicianRoutes from "./module/technecian/technician.route";
import serviceRoutes from "./module/service/service.route";

const app: Application = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/technician", technicianRoutes);
app.use("/api/service", serviceRoutes);

app.get("/test", async (req, res) => {
  try {
    const user = await prisma.user.findMany();
    console.log(user);
    res.send(user);
  } catch (error) {
    console.log(error);
  }
});

export default app;

app.use(globalError);
