import express, { type Application } from "express";
import { prisma } from "./lib/prisma";
import cors from "cors";
import cookieParser from "cookie-parser";

const app: Application = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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
