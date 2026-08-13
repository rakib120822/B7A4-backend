import { BookingStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import httpStatus from "http-status";

const createBooking = async (payload: {
  serviceId: string;
  startDate: Date;
  userId: string;
  endDate: Date;
}) => {
  const { serviceId, startDate, endDate, userId } = payload;
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found");
  }

  const existingBooking = await prisma.booking.findFirst({
    where: {
      serviceId,
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
  });

  if (existingBooking) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This service is already booked for the selected time range",
    );
  }

  const price =
    Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1000)) *
    service.pricePerHour;

  const booking = await prisma.booking.create({
    data: {
      serviceId,
      userId,
      price,
      startDate,
      endDate,
    },
    include: {
      service: true,
      user: true,
    },
  });

  return booking;
};

const getBookings = async (
  userId: string,
  query: { status?: BookingStatus },
) => {
  const bookings = await prisma.booking.findMany({
    where: {
      userId,
      ...query,
    },
    select: {
      service: {
        select: {
          serviceName: true,
          pricePerHour: true,
        },
        include: {
          technicianProfile: {
            select: {
              user: {
                select: {
                  name: true,
                  profile: {
                    select: { phone: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return bookings;
};

const updateBooking = async (
  bookingId: string,
  userId: String,
  status: BookingStatus,
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: { select: { technicianProfile: { select: { user: true } } } },
    },
  });
  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Not found");
  }
  if (booking.userId === userId || booking.userId === userId) {
    await prisma.booking.update({ where: { id: bookingId }, data: { status } });
    return {};
  } else {
    throw new AppError(httpStatus.UNAUTHORIZED, "You are not eligible");
  }
};

const bookingService = {
  createBooking,
  getBookings,
  updateBooking,
};

export default bookingService;
