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
import bookingRoutes from "./module/booking/booking.route";
import paymentRoutes from "./module/payment/payment.route";
import reviewRoutes from "./module/review/review.route";
import paymentController from "./module/payment/payment.controller";


const app: Application = express();

// Stripe webhook - must be before JSON parsing (raw body required)
app.post("/webhooks", express.raw({ type: "application/json" }), paymentController.webhook);
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), paymentController.webhook);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/technician", technicianRoutes);
app.use("/api/service", serviceRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

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
