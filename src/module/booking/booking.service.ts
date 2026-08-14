import { BookingStatus, Role } from "../../../generated/prisma/enums";
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
    include: {
      service: {
        select: {
          id: true,
          serviceName: true,
          description: true,
          pricePerHour: true,
          serviceArea: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          technicianProfile: {
            select: {
              id: true,
              experience: true,
              rating: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profile: {
                    select: {
                      phone: true,
                      address: true,
                      image: true,
                    },
                  },
                },
              },
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
      payment: {
        select: {
          id: true,
          amount: true,
          status: true,
          stripePaymentIntentId: true,
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
  if (booking.status === BookingStatus.CANCELED) {
    throw new AppError(httpStatus.NOT_MODIFIED, "Not possible");
  }
  if (
    booking.userId === userId ||
    booking.service.technicianProfile.user.id === userId
  ) {
    await prisma.booking.update({ where: { id: bookingId }, data: { status } });
    return {};
  } else {
    throw new AppError(httpStatus.UNAUTHORIZED, "You are not eligible");
  }
};

// Get all bookings for technician's dashboard (sorted with PENDING first)
const getTechnicianDashboardBookings = async (technicianUserId: string) => {
  // Get technician's profile
  const technicianProfile = await prisma.technicianProfile.findUnique({
    where: { userId: technicianUserId },
  });

  if (!technicianProfile) {
    throw new AppError(httpStatus.NOT_FOUND, "Technician profile not found");
  }

  // Get all services for this technician
  const services = await prisma.service.findMany({
    where: { technicianId: technicianProfile.id },
    select: { id: true },
  });

  if (services.length === 0) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No services found for this technician",
    );
  }

  const serviceIds = services.map((s) => s.id);

  // Get all bookings for these services, sorted by status (PENDING first)
  const bookings = await prisma.booking.findMany({
    where: {
      serviceId: { in: serviceIds },
    },
    include: {
      service: {
        select: {
          id: true,
          serviceName: true,
          description: true,
          pricePerHour: true,
          serviceArea: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: {
            select: {
              phone: true,
              address: true,
              image: true,
            },
          },
        },
      },
      payment: {
        select: {
          id: true,
          amount: true,
          status: true,
          stripePaymentIntentId: true,
        },
      },
    },
    orderBy: [
      {
        status: "asc", // PENDING comes first (P before other letters)
      },
      {
        createdAt: "desc", // Then sort by date (newest first)
      },
    ],
  });

  return bookings;
};

const bookingService = {
  createBooking,
  getBookings,
  updateBooking,
  getTechnicianDashboardBookings,
};

export default bookingService;
