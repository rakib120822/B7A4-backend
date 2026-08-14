import { BookingStatus, PaymentStatus } from "../../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { stripe } from "../lib/stripe";
import { AppError } from "../utils/app-error";
import httpStatus from "http-status";
const createCheckoutSession = async (customerId: string, bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }
  if (booking.userId !== customerId) {
    throw new AppError(httpStatus.FORBIDDEN, "This is not your booking");
  }
  if (booking.status !== BookingStatus.ACCEPTED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Can't  Pay for ${booking.status} booking`,
    );
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    metadata: { bookingId: booking.id },
    success_url: "localhost:3000/payment/success",
    cancel_url: "localhost:3000/payment/cancel",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "USD",
          unit_amount: Math.round(booking.price * 100),
          product_data: {
            name: `${booking.service.serviceName}`,
          },
        },
      },
    ],
  });

  await prisma.payment.upsert({
    where: { bookingId: booking.id },
    create: {
      stripeSessionId: session.id,
      amount: booking.price,
      bookingId: booking.id,
      userId: customerId,
    },
    update: {
      stripeSessionId: session.id,
      amount: booking.price,
      bookingId: booking.id,
      userId: customerId,
    },
  });

  return { checkoutUrl: session.url };
};

const completePayment = async (bookingId: string, stripeSessionId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { bookingId, stripeSessionId },
  });

  if (!payment || payment.status === PaymentStatus.SUCCEEDED) {
    return;
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: { status: PaymentStatus.SUCCEEDED, stripeSessionId },
    }),
    prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: { status: BookingStatus.PAID },
    }),
  ]);
};

// Get all payments for a user
const getPaymentsByUser = async (userId: string) => {
  const payments = await prisma.payment.findMany({
    where: { userId },
    include: {
      booking: {
        include: {
          service: {
            include: {
              category: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!payments || payments.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "No payments found for this user");
  }

  return payments;
};

// Get all payments (admin only)
const getAllPayments = async () => {
  const payments = await prisma.payment.findMany({
    include: {
      booking: {
        include: {
          service: {
            include: {
              category: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return payments;
};

// Get payment by ID
const getPaymentById = async (paymentId: string, userId?: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          service: {
            include: {
              category: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  // Check if user is authorized to view this payment (user can only see their own payments)
  if (userId && payment.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to view this payment");
  }

  return payment;
};

const paymentService = { 
  createCheckoutSession,
  completePayment,
  getPaymentsByUser,
  getAllPayments,
  getPaymentById,
};
export default paymentService;
