import type { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { AppError } from "../../utils/app-error";
import httpStatus from "http-status";
import type Stripe from "stripe";
import { stripe } from "../../lib/stripe";
import config from "../../config";
import paymentService from "./payment.service";
import { prisma } from "../../lib/prisma";
import { PaymentStatus } from "../../../generated/prisma/enums";
import z from "zod";
import { sendResponse } from "../../utils/sendResponse";

const webhook = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // console.log("this is from webhook:");
    const signature = req.headers["stripe-signature"];
    // console.log("signature : ",signature)
    if (!signature) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Missing stripe-signature Header",
      );
    }
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        config.stripeWebhookSecret,
      );
    } catch (error) {
      console.log(error);
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid webhook signature");
    }
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (bookingId) {
      console.log("this is the event type  : ", event.type);
      if (event.type === "checkout.session.completed") {
        await paymentService.completePayment(bookingId, session.id);
      } else if (
        event.type === "checkout.session.expired" ||
        event.type === "checkout.session.async_payment_failed"
      ) {
        await prisma.payment.update({
          where: { bookingId, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.FAILED },
        });
      }
    }

    res.json({ received: true });
  },
);
const paramsIdSchema = z.object({
  id: z.uuid("Invalid id"),
});
const checkout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const params = paramsIdSchema.parse(req.params);
    const result = await paymentService.createCheckoutSession(
      req.user?.id as string,
      params.id as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Checkout session created",
      data: result,
    });
  },
);

// Get all payments for the current user
const getMyPayments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const result = await paymentService.getPaymentsByUser(userId as string);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payments retrieved successfully",
      data: result,
    });
  },
);

// Get all payments (admin only)
const getAllPayments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await paymentService.getAllPayments();
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All payments retrieved successfully",
      data: result,
    });
  },
);

// Get payment by ID
const getPaymentById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const params = paramsIdSchema.parse(req.params);
   

    const result = await paymentService.getPaymentById(
      params.id,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payment retrieved successfully",
      data: result,
    });
  },
);

const paymentController = {
  webhook,
  checkout,
  getMyPayments,
  getAllPayments,
  getPaymentById,
};

export default paymentController;
