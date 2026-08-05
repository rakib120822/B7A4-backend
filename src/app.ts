import express, { type Application } from "express";
import { prisma } from "./lib/prisma";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./module/user/user.route";
import globalError from "./middleware/globalErrorHandler";

const app: Application = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/users", userRoutes);

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
