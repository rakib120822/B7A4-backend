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

const paymentService = { createCheckoutSession ,completePayment};
export default paymentService;
